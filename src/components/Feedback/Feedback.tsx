import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, Icon, Label, Link, Stack, Text, TextArea, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackFeatureFeedback, trackFeatureFeedbackComment } from 'features/tracking/feedbackEvents';

import { Toggletip } from 'components/Toggletip';

interface FeedbackAboutProps {
  text: string;
  link?: string;
  linkText?: string;
}

interface FeedbackProps {
  about?: FeedbackAboutProps;
  feature: string;
}

export const Feedback = ({ about, feature }: FeedbackProps) => {
  const styles = useStyles2(getStyles);
  // because the form is in a toggletip, we want to save the feedback if they
  // haven't submitted it in case they accidentally close the toggletip
  const [savedGoodFeedback, setSavedGoodFeedback] = useState<string>(``);
  const [savedBadFeedback, setSavedBadFeedback] = useState<string>(``);

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      {about && <FeedbackAbout {...about} />}
      <Toggletip
        content={
          <FeedbackForm
            feature={feature}
            reaction="good"
            savedFeedback={savedGoodFeedback}
            handleSaveFeedback={setSavedGoodFeedback}
          />
        }
      >
        <Button
          aria-label="I love this feature"
          fill="text"
          onClick={() => trackFeatureFeedback({ feature, reaction: 'good' })}
          size="sm"
          icon="thumbs-up"
          tooltip="I love this feature"
        />
      </Toggletip>
      <div className={styles.upsideDown}>
        <Toggletip
          content={
            <FeedbackForm
              feature={feature}
              reaction="bad"
              savedFeedback={savedBadFeedback}
              handleSaveFeedback={setSavedBadFeedback}
            />
          }
        >
          <Button
            aria-label="I don't like this feature"
            fill="text"
            onClick={() => trackFeatureFeedback({ feature, reaction: 'bad' })}
            size="sm"
            icon="thumbs-up"
            tooltip="I don't like this feature"
          />
        </Toggletip>
      </div>
    </Stack>
  );
};

const FeedbackAbout = ({ text, link, linkText = `Learn more` }: FeedbackAboutProps) => {
  if (!link) {
    return <Badge color="blue" text={text} />;
  }

  return (
    <Tooltip content={linkText}>
      <Link href={link} target="_blank">
        <Badge
          color="blue"
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
