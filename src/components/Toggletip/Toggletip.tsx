import React, { useEffect, useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { IconButton, PopoverContent, Toggletip as GrafanaToggletip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

type ToggletipProps = {
  iconClassName?: string;
  content: React.ReactNode;
  icon: IconName;
  tooltip: PopoverContent;
};

export const Toggletip = ({ iconClassName, content, icon, tooltip }: ToggletipProps) => {
  const [toggleTipOpen, setIsToggleTipOpen] = useState(false);

  const handleVisible = (visible: boolean) => {
    setIsToggleTipOpen(visible);
  };

  return (
    <GrafanaToggletip content={<ContentWrapper onVisible={handleVisible}>{content}</ContentWrapper>}>
      <IconButton aria-expanded={toggleTipOpen} name={icon} tooltip={tooltip} className={iconClassName} />
    </GrafanaToggletip>
  );
};

type ContentWrapperProps = {
  children: React.ReactNode;
  onVisible: (visible: boolean) => void;
};

const ContentWrapper = ({ children, onVisible }: ContentWrapperProps) => {
  const styles = useStyles2(getStyles);

  useEffect(() => {
    onVisible(true);

    return () => onVisible(false);
  }, [onVisible]);

  return <div className={styles.toggletipCard}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  toggletipCard: css({
    margin: theme.spacing(-1, 0, -1, 0),
  }),
});
