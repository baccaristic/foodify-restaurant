import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Edit3,
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import { Calendar, type DateObject } from 'react-native-calendars';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type {
  DayOfWeek,
  DayScheduleDTO,
  LocalTimeDTO,
  OperatingHoursResponseDTO,
  SpecialDayDTO,
  SpecialDayRequestDTO,
} from '../types/api';
import type { RootStackParamList } from '../navigation';

const backgroundImage = require('../../assets/background.png');

const DAY_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS: Record<DayOfWeek, { short: string; full: string }> = {
  MONDAY: { short: 'Mon', full: 'Monday' },
  TUESDAY: { short: 'Tue', full: 'Tuesday' },
  WEDNESDAY: { short: 'Wed', full: 'Wednesday' },
  THURSDAY: { short: 'Thu', full: 'Thursday' },
  FRIDAY: { short: 'Fri', full: 'Friday' },
  SATURDAY: { short: 'Sat', full: 'Saturday' },
  SUNDAY: { short: 'Sun', full: 'Sunday' },
};

const DEFAULT_OPEN_TIME: LocalTimeDTO = { hour: 9, minute: 0, second: 0, nano: 0 };
const DEFAULT_CLOSE_TIME: LocalTimeDTO = { hour: 17, minute: 0, second: 0, nano: 0 };
const ERROR_COLOR = '#E53935';

type TimePickerTarget = { type: 'weekly'; day: DayOfWeek } | { type: 'special' };

const to24Hour = (hour12: number, period: 'AM' | 'PM'): number => {
  const normalized = hour12 % 12;
  return period === 'AM' ? normalized : normalized + 12;
};

const to12Hour = (hour24: number): { hour: number; period: 'AM' | 'PM' } => {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const base = hour24 % 12;
  return { hour: base === 0 ? 12 : base, period };
};

const formatNumber = (value: number): string => `${value}`.padStart(2, '0');

const formatLocalTime = (time: LocalTimeDTO): string => {
  const { hour, period } = to12Hour(time.hour);
  const minute = formatNumber(time.minute);
  return `${formatNumber(hour)}:${minute} ${period}`;
};

const formatTimeRange = (opensAt: LocalTimeDTO, closesAt: LocalTimeDTO): string =>
  `${formatLocalTime(opensAt)} - ${formatLocalTime(closesAt)}`;

const sortWeeklySchedule = (schedule: DayScheduleDTO[]): DayScheduleDTO[] =>
  [...schedule].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

const createLocalTime = (hour: number, minute: number): LocalTimeDTO => ({
  hour,
  minute,
  second: 0,
  nano: 0,
});

const cloneSchedule = (schedule: DayScheduleDTO[]): DayScheduleDTO[] =>
  schedule.map((day) => ({
    ...day,
    opensAt: { ...day.opensAt },
    closesAt: { ...day.closesAt },
  }));

const cloneSpecialDay = (day: SpecialDayDTO): SpecialDayDTO => ({
  ...day,
  opensAt: { ...day.opensAt },
  closesAt: { ...day.closesAt },
});

const sortSpecialDays = (days: SpecialDayDTO[]): SpecialDayDTO[] =>
  [...days].sort((a, b) => a.date.localeCompare(b.date));

const formatSpecialDayDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${weekday} ${day} ${month}`;
};

const getWeeklySummary = (schedule: DayScheduleDTO[]): { range: string; hours: string } => {
  const openDays = sortWeeklySchedule(schedule).filter((day) => day.open);

  if (openDays.length === 0) {
    return { range: 'Closed all week', hours: '—' };
  }

  const firstDay = DAY_LABELS[openDays[0]?.day ?? 'MONDAY'].full;
  const lastDay = DAY_LABELS[openDays[openDays.length - 1]?.day ?? 'SUNDAY'].full;
  const range = openDays.length === 7 ? 'Monday - Sunday' : `${firstDay} - ${lastDay}`;

  const uniqueHours = new Set(openDays.map((day) => formatTimeRange(day.opensAt, day.closesAt)));
  const hours = uniqueHours.size === 1 ? Array.from(uniqueHours)[0] ?? '' : 'Varies by day';

  return { range, hours };
};

type OperatingHoursScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OperatingHours'
>;

export const OperatingHoursScreen: React.FC = () => {
  const navigation = useNavigation<OperatingHoursScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<DayScheduleDTO[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDayDTO[]>([]);
  const [isWeeklyEditorVisible, setWeeklyEditorVisible] = useState(false);
  const [weeklyDraft, setWeeklyDraft] = useState<DayScheduleDTO[]>([]);
  const [isSavingWeekly, setIsSavingWeekly] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget | null>(null);
  const [timePickerRange, setTimePickerRange] = useState<{ opensAt: LocalTimeDTO; closesAt: LocalTimeDTO } | null>(
    null
  );
  const [specialDayModal, setSpecialDayModal] = useState<
    { visible: false } | { visible: true; day: SpecialDayDTO }
  >({ visible: false });
  const [isSavingSpecialDay, setIsSavingSpecialDay] = useState(false);
  const [deletingDayId, setDeletingDayId] = useState<number | null>(null);
  const timePickerTitle = useMemo(() => {
    if (!timePickerTarget) {
      return 'Set hours';
    }

    if (timePickerTarget.type === 'weekly') {
      return `Set ${DAY_LABELS[timePickerTarget.day].full} hours`;
    }

    return 'Set special day hours';
  }, [timePickerTarget]);

  const loadOperatingHours = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await restaurantApi.getOperatingHours();
      applyOperatingHoursResponse(data);
    } catch (err) {
      setError('Unable to load operating hours. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyOperatingHoursResponse = useCallback((data: OperatingHoursResponseDTO) => {
    setWeeklySchedule(sortWeeklySchedule(data.weeklySchedule));
    setSpecialDays(sortSpecialDays(data.specialDays.map(cloneSpecialDay)));
  }, []);

  useEffect(() => {
    void loadOperatingHours();
  }, [loadOperatingHours]);

  const weeklySummary = useMemo(() => getWeeklySummary(weeklySchedule), [weeklySchedule]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openWeeklyEditor = useCallback(() => {
    setWeeklyDraft(cloneSchedule(weeklySchedule));
    setWeeklyEditorVisible(true);
  }, [weeklySchedule]);

  const closeWeeklyEditor = useCallback(() => {
    setWeeklyEditorVisible(false);
    setTimePickerTarget(null);
    setTimePickerRange(null);
  }, []);

  const handleToggleDay = useCallback((day: DayOfWeek, open: boolean) => {
    setWeeklyDraft((prev) =>
      prev.map((item) => {
        if (item.day !== day) {
          return item;
        }

        if (!open) {
          return { ...item, open };
        }

        const nextOpensAt = item.opensAt ?? DEFAULT_OPEN_TIME;
        const nextClosesAt = item.closesAt ?? DEFAULT_CLOSE_TIME;

        return {
          ...item,
          open,
          opensAt: { ...nextOpensAt },
          closesAt: { ...nextClosesAt },
        };
      })
    );
  }, []);

  const handleEditHours = useCallback(
    (day: DayOfWeek) => {
      const scheduleDay = weeklyDraft.find((item) => item.day === day);
      if (!scheduleDay) {
        return;
      }

      setTimePickerTarget({ type: 'weekly', day });
      setTimePickerRange({
        opensAt: { ...scheduleDay.opensAt },
        closesAt: { ...scheduleDay.closesAt },
      });
    },
    [weeklyDraft]
  );

  const handleConfirmHours = useCallback(
    (opensAt: LocalTimeDTO, closesAt: LocalTimeDTO) => {
      const target = timePickerTarget;
      if (!target) {
        return;
      }

      if (target.type === 'weekly') {
        setWeeklyDraft((prev) =>
          prev.map((item) =>
            item.day === target.day
              ? {
                  ...item,
                  opensAt: { ...opensAt },
                  closesAt: { ...closesAt },
                }
              : item
          )
        );
      } else if (specialDayModal.visible) {
        setSpecialDayModal({
          visible: true,
          day: {
            ...specialDayModal.day,
            opensAt: { ...opensAt },
            closesAt: { ...closesAt },
          },
        });
      }

      setTimePickerTarget(null);
      setTimePickerRange(null);
    },
    [specialDayModal, timePickerTarget]
  );

  const handleSaveWeekly = useCallback(async () => {
    setIsSavingWeekly(true);
    try {
      const response = await restaurantApi.updateWeeklySchedule(weeklyDraft);
      applyOperatingHoursResponse(response);
      setWeeklyEditorVisible(false);
    } catch (err) {
        setError('Unable to update weekly schedule. Please try again.');
    } finally {
      setIsSavingWeekly(false);
    }
  }, [applyOperatingHoursResponse, weeklyDraft]);

  const handleOpenSpecialDayModal = useCallback((day?: SpecialDayDTO) => {
    if (day) {
      setSpecialDayModal({ visible: true, day: cloneSpecialDay(day) });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    setSpecialDayModal({
      visible: true,
      day: {
        id: 0,
        name: '',
        date: today,
        open: true,
        opensAt: { ...DEFAULT_OPEN_TIME },
        closesAt: { ...DEFAULT_CLOSE_TIME },
      },
    });
  }, []);

  const closeSpecialDayModal = useCallback(() => {
    setSpecialDayModal({ visible: false });
    setTimePickerTarget(null);
    setTimePickerRange(null);
  }, []);

  const handleSaveSpecialDay = useCallback(
    async (day: SpecialDayDTO) => {
      setIsSavingSpecialDay(true);
      try {
        const payload: SpecialDayRequestDTO = {
          name: day.name,
          date: day.date,
          open: day.open,
          opensAt: { ...day.opensAt },
          closesAt: { ...day.closesAt },
        };

        if (day.id && day.id !== 0) {
          const updated = await restaurantApi.updateSpecialDay(day.id, payload);
          setSpecialDays((prev) =>
            sortSpecialDays(
              prev.map((item) => (item.id === updated.id ? cloneSpecialDay(updated) : item))
            )
          );
        } else {
          const created = await restaurantApi.createSpecialDay(payload);
          setSpecialDays((prev) => sortSpecialDays([...prev, cloneSpecialDay(created)]));
        }

        setSpecialDayModal({ visible: false });
      } catch (err) {
        setError('Unable to save special day. Please try again.');
      } finally {
        setIsSavingSpecialDay(false);
      }
    },
    []
  );

  const handleDeleteSpecialDay = useCallback(async (day: SpecialDayDTO) => {
    setDeletingDayId(day.id);
    try {
      await restaurantApi.deleteSpecialDay(day.id);
      setSpecialDays((prev) => prev.filter((item) => item.id !== day.id));
    } catch (err) {
      setError('Unable to delete special day. Please try again.');
    } finally {
      setDeletingDayId(null);
    }
  }, []);

  const handleEditSpecialDayHours = useCallback(() => {
    if (!specialDayModal.visible) {
      return;
    }

    setTimePickerTarget({ type: 'special' });
    setTimePickerRange({
      opensAt: { ...specialDayModal.day.opensAt },
      closesAt: { ...specialDayModal.day.closesAt },
    });
  }, [specialDayModal]);

  const handleSpecialDayChange = useCallback(
    (changes: Partial<SpecialDayDTO>) => {
      if (!specialDayModal.visible) {
        return;
      }

      setSpecialDayModal({
        visible: true,
        day: {
          ...specialDayModal.day,
          ...changes,
        },
      });
    },
    [specialDayModal]
  );

  return (
    <View style={styles.root}>
      <Image source={backgroundImage} style={styles.background} resizeMode="cover" />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}> 
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
            <ArrowLeft color={colors.primary} size={moderateScale(24)} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Operating Hours</Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOperatingHours}>
              <Text style={styles.retryLabel}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrapper}>
                <Clock3 color={colors.primary} size={moderateScale(40)} strokeWidth={2.2} />
              </View>
              <Text style={styles.heroTitle}>Operating Hours</Text>
              <Text style={styles.heroSubtitle}>
                Tell customers when you're open—and when you're ready to receive orders.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weekly Schedule</Text>
                <Text style={styles.sectionSubtitle}>{weeklySummary.range}</Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={openWeeklyEditor} activeOpacity={0.85}>
                <Text style={styles.primaryButtonLabel}>Edit weekly schedule</Text>
              </TouchableOpacity>
              <Text style={styles.secondaryInfo}>{weeklySummary.hours}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Special days</Text>
                <Text style={styles.sectionSubtitle}>
                  Add specific days with special working hours
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, styles.secondaryButton]}
                onPress={() => handleOpenSpecialDayModal()}
                activeOpacity={0.85}
              >
                <Plus color={colors.primary} size={moderateScale(20)} strokeWidth={2.4} />
                <Text style={[styles.primaryButtonLabel, styles.secondaryButtonLabel]}>Add special day</Text>
              </TouchableOpacity>

              {specialDays.length === 0 ? (
                <Text style={styles.emptyStateLabel}>No special days added yet.</Text>
              ) : (
                <View style={styles.specialDaysList}>
                  {specialDays.map((day) => (
                    <SpecialDayCard
                      key={day.id}
                      day={day}
                      onEdit={() => handleOpenSpecialDayModal(day)}
                      onDelete={() => handleDeleteSpecialDay(day)}
                      deleting={deletingDayId === day.id}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <WeeklyScheduleModal
        visible={isWeeklyEditorVisible}
        schedule={weeklyDraft}
        onClose={closeWeeklyEditor}
        onToggleDay={handleToggleDay}
        onEditHours={handleEditHours}
        onSave={handleSaveWeekly}
        saving={isSavingWeekly}
      />

      <SpecialDayFormModal
        state={specialDayModal}
        onClose={closeSpecialDayModal}
        onChange={handleSpecialDayChange}
        onEditHours={handleEditSpecialDayHours}
        onSubmit={handleSaveSpecialDay}
        saving={isSavingSpecialDay}
      />

      <DailyHoursModal
        visible={timePickerTarget !== null && timePickerRange !== null}
        title={timePickerTitle}
        initialOpensAt={timePickerRange?.opensAt ?? DEFAULT_OPEN_TIME}
        initialClosesAt={timePickerRange?.closesAt ?? DEFAULT_CLOSE_TIME}
        onCancel={() => {
          setTimePickerTarget(null);
          setTimePickerRange(null);
        }}
        onConfirm={handleConfirmHours}
      />
    </View>
  );
};

type WeeklyScheduleModalProps = {
  visible: boolean;
  schedule: DayScheduleDTO[];
  onClose: () => void;
  onToggleDay: (day: DayOfWeek, open: boolean) => void;
  onEditHours: (day: DayOfWeek) => void;
  onSave: () => void;
  saving: boolean;
};

const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({
  visible,
  schedule,
  onClose,
  onToggleDay,
  onEditHours,
  onSave,
  saving,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Operating Hours</Text>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                  <X color={colors.primary} size={moderateScale(20)} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {sortWeeklySchedule(schedule).map((day) => {
                const labels = DAY_LABELS[day.day];
                return (
                  <View key={day.day} style={styles.weeklyRow}>
                    <View style={styles.weeklyDayColumn}>
                      <View style={styles.weeklyIconWrapper}>
                        <CalendarDays color={colors.primary} size={moderateScale(18)} strokeWidth={2.2} />
                      </View>
                      <Text style={styles.weeklyDayLabel}>{labels.short}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.setHoursButton, !day.open && styles.setHoursButtonDisabled]}
                      onPress={() => onEditHours(day.day)}
                      activeOpacity={0.85}
                      disabled={!day.open}
                    >
                      <Text style={styles.setHoursLabel}>
                        {day.open ? formatTimeRange(day.opensAt, day.closesAt) : 'Set hours'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.weeklyToggleWrapper}>
                      <Text style={styles.weeklyStatusLabel}>{day.open ? 'Open' : 'Closed'}</Text>
                      <Switch
                        value={day.open}
                        onValueChange={(value) => onToggleDay(day.day, value)}
                        trackColor={{ false: '#E0E0E0', true: colors.primary }}
                        thumbColor={day.open ? colors.white : '#f4f3f4'}
                      />
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.primaryButton, styles.modalSaveButton]}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

type TimeValue = { hour: number; minute: number; period: 'AM' | 'PM' };

const toTimeValue = (time: LocalTimeDTO): TimeValue => {
  const { hour, period } = to12Hour(time.hour);
  return { hour, minute: time.minute, period };
};

const fromTimeValue = (value: TimeValue): LocalTimeDTO =>
  createLocalTime(to24Hour(value.hour, value.period), value.minute);

type DailyHoursModalProps = {
  visible: boolean;
  title: string;
  initialOpensAt: LocalTimeDTO;
  initialClosesAt: LocalTimeDTO;
  onCancel: () => void;
  onConfirm: (opensAt: LocalTimeDTO, closesAt: LocalTimeDTO) => void;
};

const DailyHoursModal: React.FC<DailyHoursModalProps> = ({
  visible,
  title,
  initialOpensAt,
  initialClosesAt,
  onCancel,
  onConfirm,
}) => {
  const [opensAtValue, setOpensAtValue] = useState<TimeValue>(toTimeValue(initialOpensAt));
  const [closesAtValue, setClosesAtValue] = useState<TimeValue>(toTimeValue(initialClosesAt));

  useEffect(() => {
    setOpensAtValue(toTimeValue(initialOpensAt));
    setClosesAtValue(toTimeValue(initialClosesAt));
  }, [initialClosesAt, initialOpensAt]);

  const handleConfirm = () => {
    onConfirm(fromTimeValue(opensAtValue), fromTimeValue(closesAtValue));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.timePickerCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onCancel} style={styles.modalCloseButton}>
                  <X color={colors.primary} size={moderateScale(20)} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              <TimeInput label="Opens" value={opensAtValue} onChange={setOpensAtValue} />
              <TimeInput label="Closes" value={closesAtValue} onChange={setClosesAtValue} />

              <TouchableOpacity
                style={[styles.primaryButton, styles.modalSaveButton]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonLabel}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

type NumberStepperProps = {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const NumberStepper: React.FC<NumberStepperProps> = ({ label, value, onIncrement, onDecrement }) => (
  <View style={styles.stepperWrapper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <TouchableOpacity style={styles.stepperButton} onPress={onIncrement}>
      <ChevronUp color={colors.primary} size={moderateScale(20)} strokeWidth={2.2} />
    </TouchableOpacity>
    <Text style={styles.stepperValue}>{formatNumber(value)}</Text>
    <TouchableOpacity style={styles.stepperButton} onPress={onDecrement}>
      <ChevronDown color={colors.primary} size={moderateScale(20)} strokeWidth={2.2} />
    </TouchableOpacity>
  </View>
);

type TimeInputProps = {
  label: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
};

const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
  const adjustHour = (delta: number) => {
    const nextHour = ((value.hour - 1 + delta + 12) % 12) + 1;
    onChange({ ...value, hour: nextHour });
  };

  const adjustMinute = (delta: number) => {
    const nextMinute = (value.minute + delta + 60) % 60;
    onChange({ ...value, minute: nextMinute });
  };

  return (
    <View style={styles.timeInputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.timePickerContent}>
        <NumberStepper label="Hour" value={value.hour} onIncrement={() => adjustHour(1)} onDecrement={() => adjustHour(-1)} />
        <Text style={styles.timePickerSeparator}>:</Text>
        <NumberStepper
          label="Minute"
          value={value.minute}
          onIncrement={() => adjustMinute(1)}
          onDecrement={() => adjustMinute(-1)}
        />
      </View>
      <View style={styles.periodToggleRow}>
        {(['AM', 'PM'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.periodButton, value.period === item && styles.periodButtonActive]}
            onPress={() => onChange({ ...value, period: item })}
            activeOpacity={0.85}
          >
            <Text style={[styles.periodLabel, value.period === item && styles.periodLabelActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

type SpecialDayFormModalProps = {
  state:
    | { visible: false }
    | { visible: true; day: SpecialDayDTO };
  onClose: () => void;
  onChange: (changes: Partial<SpecialDayDTO>) => void;
  onEditHours: () => void;
  onSubmit: (day: SpecialDayDTO) => Promise<void>;
  saving: boolean;
};

const SpecialDayFormModal: React.FC<SpecialDayFormModalProps> = ({
  state,
  onClose,
  onChange,
  onEditHours,
  onSubmit,
  saving,
}) => {
  if (!state.visible) {
    return null;
  }

  const { day } = state;

  const handleSelectDate = (date: DateObject) => {
    onChange({ date: date.dateString });
  };

  const handleSubmit = () => {
    void onSubmit(day);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.specialDayCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{day.id ? 'Edit special day' : 'Add special day'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                  <X color={colors.primary} size={moderateScale(20)} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Holiday name"
                value={day.name}
                onChangeText={(value) => onChange({ name: value })}
                placeholderTextColor="rgba(17, 51, 83, 0.4)"
              />

              <Text style={[styles.inputLabel, { marginTop: moderateScale(16) }]}>Date</Text>
              <Calendar
                current={day.date}
                onDayPress={handleSelectDate}
                markedDates={{
                  [day.date]: {
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: colors.white,
                  },
                }}
                theme={{
                  calendarBackground: colors.white,
                  textSectionTitleColor: colors.primary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.white,
                  todayTextColor: colors.primary,
                  arrowColor: colors.primary,
                }}
                style={styles.calendar}
              />

              <View style={styles.specialDayToggleRow}>
                <Text style={styles.inputLabel}>Open</Text>
                <Switch
                  value={day.open}
                  onValueChange={(value) => onChange({ open: value })}
                  trackColor={{ false: '#E0E0E0', true: colors.primary }}
                  thumbColor={day.open ? colors.white : '#f4f3f4'}
                />
              </View>

              {day.open ? (
                <TouchableOpacity
                  style={[styles.specialDayHoursButton, styles.specialDayHoursButtonFull]}
                  onPress={onEditHours}
                  activeOpacity={0.85}
                >
                  <Text style={styles.specialDayHoursLabel}>
                    Hours: {formatTimeRange(day.opensAt, day.closesAt)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.specialDayClosedNote}>Customers will see this day as closed.</Text>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, styles.modalSaveButton]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

type SpecialDayCardProps = {
  day: SpecialDayDTO;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

const SpecialDayCard: React.FC<SpecialDayCardProps> = ({ day, onEdit, onDelete, deleting }) => (
  <View style={styles.specialDayItem}>
    <View style={styles.specialDayIconWrapper}>
      <CalendarDays color={colors.primary} size={moderateScale(22)} strokeWidth={2.2} />
    </View>
    <View style={styles.specialDayInfo}>
      <Text style={styles.specialDayTitle}>{formatSpecialDayDate(day.date)}</Text>
      <Text style={styles.specialDaySubtitle}>{day.name}</Text>
      <Text style={styles.specialDayMeta}>
        {day.open ? `Open ${formatTimeRange(day.opensAt, day.closesAt)}` : 'Closed'}
      </Text>
    </View>
    <View style={styles.specialDayActions}>
      <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
        <Edit3 color={colors.primary} size={moderateScale(18)} strokeWidth={2.2} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.iconButton} disabled={deleting}>
        {deleting ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Trash2 color={ERROR_COLOR} size={moderateScale(18)} strokeWidth={2.2} />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(12),
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    ...typography.bodyStrong,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  errorText: {
    ...typography.bodyMedium,
    color: ERROR_COLOR,
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(16),
  },
  retryLabel: {
    ...typography.button,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(20),
  },
  heroIconWrapper: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(16),
  },
  heroTitle: {
    ...typography.h2,
    fontSize: moderateScale(24),
    color: colors.primary,
    marginBottom: moderateScale(12),
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    marginTop: moderateScale(24),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: moderateScale(4),
  },
  primaryButton: {
    marginTop: moderateScale(12),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  primaryButtonLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryInfo: {
    marginTop: moderateScale(12),
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  secondaryButton: {
    backgroundColor: '#F6F8FF',
  },
  secondaryButtonLabel: {
    color: colors.primary,
  },
  emptyStateLabel: {
    marginTop: moderateScale(16),
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  specialDaysList: {
    marginTop: moderateScale(16),
    gap: moderateScale(12),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  modalCard: {
    width: '100%',
    maxWidth: moderateScale(420),
    backgroundColor: colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(24),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    ...typography.bodyStrong,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  modalCloseButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EAED',
  },
  weeklyDayColumn: {
    width: moderateScale(64),
    alignItems: 'flex-start',
    gap: moderateScale(6),
  },
  weeklyIconWrapper: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyDayLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  setHoursButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: '#F6F8FF',
  },
  setHoursButtonDisabled: {
    opacity: 0.5,
  },
  setHoursLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  weeklyToggleWrapper: {
    marginLeft: moderateScale(12),
    alignItems: 'center',
  },
  weeklyStatusLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: moderateScale(4),
  },
  modalSaveButton: {
    marginTop: moderateScale(20),
  },
  timePickerCard: {
    width: '100%',
    maxWidth: moderateScale(360),
    backgroundColor: colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(24),
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(12),
    marginVertical: moderateScale(16),
  },
  timePickerSeparator: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    fontSize: moderateScale(28),
    color: colors.textSecondary,
  },
  periodToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: moderateScale(12),
  },
  periodButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(14),
    backgroundColor: '#F6F8FF',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  periodLabelActive: {
    color: colors.white,
  },
  stepperWrapper: {
    alignItems: 'center',
  },
  stepperLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: moderateScale(8),
  },
  stepperButton: {
    width: moderateScale(48),
    height: moderateScale(40),
    borderRadius: moderateScale(16),
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  stepperValue: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    fontSize: moderateScale(28),
    color: colors.textPrimary,
    marginBottom: moderateScale(8),
  },
  timeInputBlock: {
    marginBottom: moderateScale(20),
    backgroundColor: '#F6F8FF',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
  },
  specialDayCard: {
    width: '100%',
    maxWidth: moderateScale(420),
    backgroundColor: colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(24),
  },
  inputLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  textInput: {
    marginTop: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E0E4EC',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  calendar: {
    marginTop: moderateScale(12),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  specialDayToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(20),
  },
  specialDayHoursButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: '#F6F8FF',
  },
  specialDayHoursButtonFull: {
    marginTop: moderateScale(16),
  },
  specialDayHoursLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  specialDayClosedNote: {
    marginTop: moderateScale(16),
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  specialDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    gap: moderateScale(12),
  },
  specialDayIconWrapper: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialDayInfo: {
    flex: 1,
  },
  specialDayTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  specialDaySubtitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginTop: moderateScale(2),
  },
  specialDayMeta: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: moderateScale(6),
  },
  specialDayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  iconButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
