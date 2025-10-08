import React from 'react';
import { css } from '@emotion/css';

import { Preformatted } from 'components/Preformatted';

interface LogDetailsProps {
  content: string | object;
}
export function LogDetails({ content }: LogDetailsProps) {
  return (
    <Preformatted>
      {content && typeof content === 'object'
        ? Object.entries(content).map(([key, value]) => {
            return (
              <div key={key}>
                {key}:{' '}
                <span
                  className={css`
                    opacity: 0.6;
                  `}
                >
                  {value}
                </span>
              </div>
            );
          })
        : content}
    </Preformatted>
  );
}
