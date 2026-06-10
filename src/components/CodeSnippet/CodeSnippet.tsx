import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, ClipboardButton, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import { highlight, languages } from 'prismjs';

import { CodeSnippetGroupProps, CodeSnippetProps, CodeSnippetTabProps } from './CodeSnippet.types';

import { getStyles } from './CodeSnippet.styles';
import { formatCode, getTab, identity } from './CodeSnippet.utils';
import { SnippetWindow } from './SnippetWindow';

const CodeSnippetTab = ({ active, tab, onClick }: CodeSnippetTabProps) => {
  const handleChangeTab = () => {
    if (!active) {
      onClick(tab.value);
    }
  };

  return <Tab label={tab.label} active={active} onChangeTab={handleChangeTab} />;
};

const CodeSnippetGroup = ({ active = false, group, onClick }: CodeSnippetGroupProps) => {
  const handleChangeGroup = () => {
    if (!active) {
      onClick(group.value);
    }
  };

  const styles = useStyles2(getStyles);

  return (
    <div
      className={active ? styles.activeTabGroup : styles.inactiveTabGroup}
      key={`tabGroup-${group.value}`}
      onClick={handleChangeGroup}
    >
      <span>{group.label}</span>
      {'isNew' in group && group.isNew && <Badge text="NEW" color="blue" />}
    </div>
  );
};

const CopyToClipboardButton = ({ data, onCopy }: { data: string; onCopy?: () => void }) => {
  return (
    <ClipboardButton
      icon="clipboard-alt"
      variant="secondary"
      size="sm"
      getText={() => data ?? ''}
      onClipboardCopy={onCopy}
      data-cy="copy-agent-install"
    >
      Copy
    </ClipboardButton>
  );
};

export const CodeSnippet = ({
  canCopy = true,
  code,
  lang = 'js',
  initialTab,
  tabs = [],
  className,
  hideHeader,
  onGroupChange,
  onCopy,
}: CodeSnippetProps) => {
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const styles = useStyles2(getStyles);
  const tab = getTab(activeTab, tabs);
  const hasGroups = tab && 'groups' in tab;

  const handleGroupChange = useCallback(
    (groupValue: string) => {
      setActiveGroup(groupValue);
      onGroupChange?.(groupValue);
    },
    [onGroupChange]
  );
  const snippetTab = useMemo(() => {
    if (hasGroups) {
      return getTab(activeGroup, tab.groups);
    }

    return tab;
  }, [hasGroups, activeGroup, tab]);

  const resolvedGroup = hasGroups ? activeGroup ?? tab.groups[0]?.value : undefined;

  useEffect(() => {
    if (hasGroups && tab.selected) {
      setActiveGroup(tab.selected);
    }
  }, [hasGroups, tab]);

  useEffect(() => {
    if (!activeTab) {
      setActiveTab(initialTab);
    }
  }, [activeTab, initialTab]);

  const formatter = snippetTab?.dedent ? formatCode : identity;
  const snippet = snippetTab.code.toString();
  const langSyntax = snippetTab?.lang || lang;
  const derivedActiveTab = activeTab ?? tabs[0]?.value;
  const highlightedSyntax = useMemo(
    () => snippet && highlight(formatter(snippet), languages[langSyntax], langSyntax),
    [formatter, snippet, langSyntax]
  );

  return (
    <SnippetWindow
      hideHeader={hideHeader}
      titleContent={
        tabs.length > 0 && (
          <TabsBar className={styles.tabsBar}>
            {tabs.map((tab) => {
              return (
                <CodeSnippetTab
                  key={`${tab.value}-tab`}
                  active={derivedActiveTab === tab.value}
                  tab={tab}
                  onClick={setActiveTab}
                />
              );
            })}
          </TabsBar>
        )
      }
    >
      <section className={styles.section}>
        <div className={cx(styles.codeWrapper, className)}>
          {hasGroups && (
            <div className={styles.tabGroup}>
              {tab.groups.map((group) => {
                const isGroupActive = resolvedGroup === group.value;
                return (
                  <CodeSnippetGroup
                    key={`${tab.value}-${group.value}`}
                    group={group}
                    active={isGroupActive}
                    onClick={handleGroupChange}
                  />
                );
              })}
            </div>
          )}
          <code
            className={styles.code}
            dangerouslySetInnerHTML={{ __html: highlightedSyntax ?? '' }}
            data-cy="agent-install"
          />
        </div>
        <div className={styles.buttonWrapper}>
          {canCopy && (
            <CopyToClipboardButton
              data={snippet ?? ''}
              onCopy={onCopy && resolvedGroup ? () => onCopy(resolvedGroup) : undefined}
            />
          )}
        </div>
      </section>
    </SnippetWindow>
  );
};
