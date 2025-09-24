import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, Icon, Label, Link, Stack, Text, TextArea, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackFeatureFeedback, trackFeatureFeedbackComment } from 'features/tracking/feedbackEvents';

import { Toggletip } from 'components/Toggletip';

interface FeedbackAboutProps {
  text: string;
  link?: string;
  tooltipText?: string;
}

interface FeedbackProps {
  about?: FeedbackAboutProps;
  feature: string;
}

export const Feedback = ({ about, feature }: FeedbackProps) => {
  const [active, setActive] = useState<'good' | 'bad' | null>(null);

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      {about && <FeedbackAbout {...about} />}
      <FeedbackButton
        feature={feature}
        isActive={active === 'good'}
        onClick={() => {
          setActive('good');
          trackFeatureFeedback({ feature, reaction: 'good' });
        }}
        onClose={() => setActive(null)}
        reaction="good"
        tooltip="I love this feature"
      />
      <FeedbackButton
        feature={feature}
        isActive={active === 'bad'}
        onClick={() => {
          setActive('bad');
          trackFeatureFeedback({ feature, reaction: 'bad' });
        }}
        onClose={() => setActive(null)}
        reaction="bad"
        tooltip="I don't like this feature"
      />
    </Stack>
  );
};

const FeedbackAbout = ({ text, link, tooltipText = `Learn more` }: FeedbackAboutProps) => {
  if (!link) {
    return <Badge color="blue" icon="rocket" text={text} />;
  }

  return (
    <Tooltip content={tooltipText}>
      <Link href={link} target="_blank">
        <Badge
          color="blue"
          icon="rocket"
          text={
            <Stack direction="row" gap={0.5} alignItems="center">
              {text}
              <Icon name="external-link-alt" size="xs" />
            </Stack>
          }
        />
      </Link>
    </Tooltip>
  );
};

interface ToggletipAndButtonProps {
  feature: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  reaction: 'good' | 'bad';
  tooltip: string;
}

const FeedbackButton = ({ feature, isActive, onClick, onClose, reaction, tooltip }: ToggletipAndButtonProps) => {
  // because the form is in a toggletip, we want to save the feedback if they
  // haven't submitted it in case they accidentally close the toggletip
  const [savedFeedback, setSavedFeedback] = useState<string>(``);
  const styles = useStyles2(getStyles);

  return (
    <Toggletip
      content={
        <FeedbackForm
          feature={feature}
          reaction={reaction}
          savedFeedback={savedFeedback}
          handleSaveFeedback={setSavedFeedback}
        />
      }
      onClose={onClose}
      show={isActive}
    >
      {/* Need to wrap in a div to prevent the toggletip from cloning the button and removing the onClick handler */}
      <div>
        <Button
          aria-label={tooltip}
          className={cx({ [styles.upsideDown]: reaction === 'bad' }, { [styles.active]: isActive })}
          fill="text"
          onClick={onClick}
          size="sm"
          icon="thumbs-up"
          tooltip={tooltip}
        />
      </div>
    </Toggletip>
  );
};

interface FeedbackFormValues {
  comment: string;
}

interface FeedbackFormProps {
  feature: string;
  reaction: 'good' | 'bad';
  savedFeedback: string;
  handleSaveFeedback: (feedback: string) => void;
}

const COMMENT_ID = 'comment';

const FeedbackForm = ({ feature, reaction, savedFeedback, handleSaveFeedback }: FeedbackFormProps) => {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { register, handleSubmit } = useForm<FeedbackFormValues>({
    defaultValues: {
      comment: savedFeedback,
    },
  });

  const onSubmit = useCallback(
    ({ comment }: FeedbackFormValues) => {
      // Clear the saved feedback so the form is empty
      handleSaveFeedback(``);
      setSubmitted(true);
      trackFeatureFeedbackComment({ feature, reaction, comment });
    },
    [feature, handleSaveFeedback, reaction]
  );

  const { onChange, ...rest } = register('comment');

  return (
    <div>
      {!submitted ? (
        <Stack direction="column" gap={1}>
          <Text variant="h6" element="h3">
            Thanks for the feedback!
          </Text>
          <Label htmlFor={COMMENT_ID}>If you have any additional comments, please let us know.</Label>
          <TextArea
            id={COMMENT_ID}
            rows={4}
            {...rest}
            onChange={(e) => {
              onChange(e);
              handleSaveFeedback(e.currentTarget.value);
            }}
          />
          <div>
            <Button onClick={handleSubmit(onSubmit)} type="submit">
              Submit
            </Button>
          </div>
        </Stack>
      ) : (
        <Text>Thank you! Your comments help us to improve our product.</Text>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    active: css`
      color: ${theme.colors.text.primary};
    `,
    upsideDown: css`
      svg {
        transform: rotate(180deg);
      }
    `,
    externalLink: css`
      svg {
        margin-left: 0.25rem;
      }
    `,
  };
};
