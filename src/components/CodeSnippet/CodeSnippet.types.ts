export type TabSeparatorName = 'chevron' | 'pipe';

type GrammarLanguage = 'js' | 'plain' | 'html';

export type TabProps = {
  code: string;
  dedent?: boolean;
  label: string;
  value: string;
  lang?: GrammarLanguage;
};

export type TabGroupProps = Omit<TabProps, 'code'> & {
  selected?: TabProps['value'];
  groups: TabProps[];
};

export type CodeSnippetTab = TabProps | TabGroupProps;

export interface CodeSnippetProps {
  canCopy?: boolean;
  code?: string;
  dedent?: boolean;
  initialTab?: string;
  lang?: GrammarLanguage;
  separator?: TabSeparatorName;
  tabs?: CodeSnippetTab[];
  height?: string;
  className?: string;
  hideHeader?: boolean;
}

export interface CodeSnippetTabProps {
  active: boolean;
  tab: CodeSnippetTab;
  onClick: (tabValue: string) => void;
}

export interface CodeSnippetGroupProps extends Omit<CodeSnippetTabProps, 'tab'> {
  group: CodeSnippetTab;
}
