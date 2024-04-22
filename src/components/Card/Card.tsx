import React, { createContext, HTMLAttributes, ReactNode, useContext } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Link, styleMixins, useStyles2 } from '@grafana/ui';
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
        cursor: 'pointer',
        zIndex: 1,
      },
    }),
  };
}

type HeadingCommonProps = {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span';
  children: ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

type HeadingProps = HTMLAttributes<HTMLElement> & HeadingCommonProps;

const Heading = ({ as = 'h2', children, className, variant = 'h2', ...rest }: HeadingProps) => {
  const Tag = as;
  const styles = useStyles2((theme) => getHeadingStyles(theme, variant));
  const { href } = useContext(CardContext);

  const content = <Tag className={cx(styles.heading, className)}>{children}</Tag>;

  if (href) {
    return (
      <Link className={styles.link} href={href} {...rest}>
        {content}
      </Link>
    );
  }

  return content;
};

const getHeadingStyles = (theme: GrafanaTheme2, variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => ({
  heading: css({
    fontFamily: theme.typography[variant].fontFamily,
    fontSize: theme.typography[variant].fontSize,
    fontWeight: theme.typography[variant].fontWeight,
    letterSpacing: theme.typography[variant].letterSpacing,
    lineHeight: theme.typography[variant].lineHeight,
  }),
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
