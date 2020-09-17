import React, { FC } from 'react';
import { css } from 'emotion';

interface Props {
  children: string;
  className?: string;
}

export const Subheader: FC<Props> = ({ children, className }) => (
  <h3
    className={css`
      font-size: 19px;
      font-weight: 100;
      line-height: 24px;
      margin-bottom: 16px;
    `}
  >
    {children}
  </h3>
);
