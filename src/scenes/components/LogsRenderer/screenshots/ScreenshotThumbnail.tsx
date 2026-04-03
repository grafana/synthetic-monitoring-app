import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { sanitizeScreenshotSrc } from './screenshots.utils';

interface ScreenshotThumbnailProps {
  base64?: string;
  url?: string;
  caption?: string;
}

export const ScreenshotThumbnail = ({ base64, url, caption }: ScreenshotThumbnailProps) => {
  const styles = useStyles2(getStyles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const src = sanitizeScreenshotSrc(url, base64);
  const alt = caption || 'Screenshot';

  if (!src) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        {caption && <div className={styles.caption}>{caption}</div>}
        <button
          type="button"
          className={styles.thumbnailButton}
          onClick={() => setIsModalOpen(true)}
          aria-label={`View full size: ${alt}`}
        >
          <img src={src} alt={alt} className={styles.thumbnail} />
        </button>
      </div>
      {isModalOpen && (
        <Modal
          title={caption ? `Screenshot: ${caption}` : 'Screenshot'}
          isOpen={true}
          onDismiss={() => setIsModalOpen(false)}
          className={styles.modalOverride}
          contentClassName={styles.modalContent}
        >
          <div className={styles.modalImageContainer}>
            <img src={src} alt={alt} className={styles.modalImage} />
          </div>
        </Modal>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background-color: ${theme.colors.background.secondary};
    width: fit-content;
  `,
  caption: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  thumbnailButton: css`
    all: unset;
    cursor: pointer;
    display: block;
    border-radius: ${theme.shape.radius.default};

    &:focus-visible {
      outline: 2px solid ${theme.colors.primary.main};
      outline-offset: 2px;
    }
  `,
  thumbnail: css`
    max-height: 200px;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: ${theme.shape.radius.default};
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  `,
  modalOverride: css`
    && {
      width: 80vw;
      max-width: 80vw;
    }
  `,
  modalContent: css`
    overflow: hidden;
  `,
  modalImageContainer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(2)};
    overflow: hidden;
  `,
  modalImage: css`
    max-width: calc(80vw - ${theme.spacing(4)});
    max-height: 75vh;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  `,
});
