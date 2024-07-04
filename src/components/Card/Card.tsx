import React, { ComponentProps, createContext, HTMLAttributes, ReactNode, useContext } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Link, styleMixins, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

type ContextProps = {
  href?: string;
};

type CardProps = ContextProps & {
  children: ReactNode;
  className?: string;
};

const CardContext = createContext<ContextProps>({ href: '' });

export const Card = ({ children, className, href }: CardProps) => {
  const styles = useStyles2(getStyles);

  return (
    <CardContext.Provider value={{ href }}>
      <div className={cx(styles.card, className)}>{children}</div>
    </CardContext.Provider>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      padding: theme.spacing(2),
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      position: `relative`,

      '&:hover': {
        background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
        zIndex: 1,
      },
    }),
  };
}

type HeadingCommonProps = {
  as?: ComponentProps<typeof Text>['element'];
  children: NonNullable<ReactNode>;
  className?: string;
  variant?: ComponentProps<typeof Text>['variant'];
};

type HeadingProps = HTMLAttributes<HTMLElement> & HeadingCommonProps;

const Heading = ({ as = 'h2', children, className, variant = 'h2', ...rest }: HeadingProps) => {
  const styles = useStyles2(getHeadingStyles);
  const { href } = useContext(CardContext);

  const content = (
    <Text element={as} variant={variant}>
      {children}
    </Text>
  );

  if (href) {
    return (
      <Link className={styles.link} href={href} {...rest}>
        {content}
      </Link>
    );
  }

  return content;
};

const getHeadingStyles = (theme: GrafanaTheme2) => ({
  link: css({
    display: `block`,
    all: 'unset',

    '&::after': {
      position: 'absolute',
      content: '""',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
    },

    '&:focus-visible': {
      outline: 'none',
      outlineOffset: 0,
      boxShadow: 'none',

      '&::after': {
        ...styleMixins.getFocusStyles(theme),
        zIndex: 1,
      },
    },
  }),
});

Card.Heading = Heading;
