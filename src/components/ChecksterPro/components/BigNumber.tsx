import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface BigNumberProps {
  title: string;
  value: string;
  unit?: string;
  subTitle?: string;
}

export function BigNumber({ title, subTitle, value, unit }: BigNumberProps) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      <div>
        <div>{title}</div>
        {!!subTitle && <div className="BigNumber-subTitle">{subTitle}</div>}
      </div>
      <div>
        <span>{value}</span>
        {!!unit && <span>{unit}</span>}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
      display: flex;
      padding: ${theme.spacing(1)};
      background-color: ${theme.colors.background.secondary};
      flex-direction: row;
      justify-content: space-between;
      
      align-items: center;
      @container (min-width: 480px) {
          flex-direction: column;
          align-items: unset;
          justify-content: unset;
      }
      //max-width: 300px;

      & > div:first-child {
          color: ${theme.colors.text.primary};
          font-size: ${theme.typography.bodySmall.fontSize};
          text-transform: uppercase;
          font-weight: 400;
      }

      & > div.BigNumber-subTitle {
          color: ${theme.colors.text.secondary};
      }
      
      & > div:last-child {
          display: flex;
          gap: ${theme.spacing(0.5)};
          align-items: baseline;

          & > span:first-child {

              flex: 0 0 auto;
              
              text-overflow: ellipsis;
              overflow: hidden;
              color: ${theme.colors.info.text};
              font-weight: 600;
              font-size: 1.5rem;
              
              @container (min-width: 480px) {
                  font-size: 2rem;
              }
          }

          & > span:nth-child(2) {
              font-size: ${theme.typography.bodySmall.fontSize};
              color: ${theme.colors.text.secondary};
              text-overflow: ellipsis;
              overflow: hidden;
              flex: 0 1 auto;
          }
  `,
});
