declare module 'react-native-qrcode-styled' {
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface QRCodeStyledProps {
    data: string;
    style?: StyleProp<ViewStyle>;
    padding?: number;
    pieceSize?: number;
    pieceBorderRadius?: number;
    pieceCornerType?: 'sharp' | 'rounded';
    color?: string;
    backgroundColor?: string;
    isPiecesGlued?: boolean;
  }

  const QRCodeStyled: React.ComponentType<QRCodeStyledProps>;
  export default QRCodeStyled;
}
