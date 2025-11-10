import React, { ComponentProps, useEffect, useMemo } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { ThemeComponents } from '@grafana/data/dist/types/themes/createComponents';
import { Dropdown, Icon, Menu, styleMixins, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useDOMId } from '../../../hooks/useDOMId';

interface TargetValueHandler<T> {
  (event: { target: { value: T } }): void;
}

type InputSize = keyof ThemeComponents['height'];

interface InputSelectProps {
  id?: string;
  size?: InputSize;
  options: SelectableValue[];
  value?: SelectableValue['value'];
  placement?: ComponentProps<typeof Dropdown>['placement'];
  onChange: TargetValueHandler<SelectableValue['value']>;
  onBlur?: TargetValueHandler<SelectableValue['value']>;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  width?: number;
  'aria-label'?: string;
}

export function InputSelect({
  id,
  value,
  placement,
  options,
  className,
  onChange,
  invalid,
  disabled,
  width,
  placeholder = 'Select',
  size = 'md',
  ...rest
}: InputSelectProps) {
  const fallbackId = useDOMId();
  const idWithFallback = id || fallbackId;

  const [internalValue, setInternalValue] = React.useState<SelectableValue['value'] | undefined>(value);
  const theme = useTheme2();
  const styles = getStyles(theme, size);
  const [isOpen, setIsOpen] = React.useState(false);
  const widthStyles = width
    ? css`
        width: ${theme.spacing(width)};
      `
    : css`
        width: 100%;
      `;
  const label = options.find((option) => internalValue === option.value)?.label ?? value;
  const dropdownId = `${idWithFallback}-options`;
  const overlay = useMemo(() => {
    return (
      <Menu id={dropdownId}>
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const optionLabel = option?.label ?? option.value;
          return (
            <Menu.Item
              role="menuitem"
              aria-label={`Select ${optionLabel}`}
              key={`${value}-${index}`}
              label={option.label ?? option.value}
              description={option.description ?? undefined}
              disabled={option.disabled}
              ariaChecked={isSelected}
              active={isSelected}
              onClick={() => {
                setInternalValue(option.value);
              }}
            />
          );
        })}
      </Menu>
    );
  }, [dropdownId, options, value]);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (value !== internalValue) {
      onChange({ target: { value: internalValue } });
    }
  }, [internalValue, onChange, value]);

  const handleVisibleChange = (visible: boolean) => {
    setIsOpen(visible);
  };

  return (
    <div className={className}>
      <Dropdown onVisibleChange={handleVisibleChange} placement={placement} overlay={overlay}>
        <button
          disabled={disabled}
          id={idWithFallback}
          type="button"
          role="combobox"
          aria-controls={dropdownId}
          value={internalValue}
          aria-haspopup="listbox"
          tabIndex={0}
          className={cx(styles.button, widthStyles, invalid && styles.invalid, isOpen && styles.focusStyles)}
          aria-valuetext={label}
          {...rest}
        >
          <span className={styles.value} title={label}>
            {label || <span className={styles.placeholder}>{placeholder}</span>}
          </span>
          <Icon name="angle-down" />
        </button>
      </Dropdown>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2, size: InputSize = 'md') {
  const inputSize = theme.components.height[size] ?? theme.components.height.md;
  const focusStyles = css({
    ...styleMixins.getFocusStyles(theme),
  });

  return {
    focusStyles,
    button: css`
      /* The idea is for the button to look like an Input/Select */
      display: flex;
      height: ${theme.spacing(inputSize)};
      background-color: ${theme.components.input.background};
      border: 1px ${theme.components.input.borderColor} solid;
      padding: ${theme.spacing(0, 1)};
      border-radius: ${theme.shape.radius.default};
      color: ${theme.components.input.text};
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      text-overflow: ellipsis;
      &[disabled] {
        cursor: not-allowed;
        background-color: ${theme.colors.action.disabledBackground};
        color: ${theme.colors.action.disabledText};
        border-color: ${theme.colors.action.disabledBackground};
      }
      &:focus {
        ${focusStyles};
      }
      &:hover {
        border-color: ${theme.components.input.borderHover};
      }
    `,
    invalid: css`
      border-color: ${theme.colors.error.border};
      &:hover {
        border-color: ${theme.colors.error.shade};
      }
    `,
    placeholder: css`
      color: ${theme.colors.text.disabled};
    `,
    value: css`
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      flex-grow: 0;
    `,
  };
}
