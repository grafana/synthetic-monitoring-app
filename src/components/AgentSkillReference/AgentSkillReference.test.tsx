import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { AgentSkillReference } from './AgentSkillReference';
import {
  AGENT_SKILL_DEFAULT_COPY,
  AGENT_SKILL_INSTALL_COMMANDS,
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AGENT_SKILL_PROMPTS,
  AGENT_SKILL_TERRAFORM_COPY,
} from './AgentSkillReference.constants';

jest.mock('features/tracking/agentSkillEvents', () => ({
  trackAgentSkillSectionViewed: jest.fn(),
  trackAgentSkillLinkClicked: jest.fn(),
  trackAgentSkillInstallCommandCopied: jest.fn(),
  trackAgentSkillToolSelected: jest.fn(),
  trackAgentSkillPromptCopied: jest.fn(),
}));

import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillPromptCopied,
  trackAgentSkillSectionViewed,
} from 'features/tracking/agentSkillEvents';

const SOURCE = 'docs-panel-scripted' as const;

describe('AgentSkillReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  it('renders both install commands and tracks the section view', async () => {
    render(<AgentSkillReference source={SOURCE} />);

    for (const { command } of AGENT_SKILL_INSTALL_COMMANDS) {
      expect(await screen.findByText(command)).toBeInTheDocument();
    }
    expect(trackAgentSkillSectionViewed).toHaveBeenCalledWith({ source: SOURCE });
  });

  it('tracks copying an install command and remembers it for feedback', async () => {
    const { user } = render(<AgentSkillReference source={SOURCE} />);

    const copyButtons = await screen.findAllByRole('button', { name: 'Copy to clipboard' });
    await user.click(copyButtons[0]);

    expect(trackAgentSkillInstallCommandCopied).toHaveBeenCalledWith({
      source: SOURCE,
      command: AGENT_SKILL_INSTALL_COMMANDS[0].trackingId,
    });
    expect(JSON.parse(localStorage.getItem(AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY) ?? 'false')).toBe(true);
    // the feedback ask must wait for a return visit, not appear mid-session
    expect(screen.queryByText('Did the skill help?')).not.toBeInTheDocument();
  });

  it('shows the example prompts and tracks copying one without a tool', async () => {
    const [SITE_PROMPT, API_SPEC_PROMPT] = AGENT_SKILL_PROMPTS;
    const { user } = render(<AgentSkillReference source={SOURCE} />);

    expect(await screen.findByText(SITE_PROMPT.prompt)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: API_SPEC_PROMPT.label }));
    expect(await screen.findByText(API_SPEC_PROMPT.prompt)).toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: 'Copy to clipboard' });
    await user.click(copyButtons[copyButtons.length - 1]);
    expect(trackAgentSkillPromptCopied).toHaveBeenCalledWith({
      source: SOURCE,
      tool: undefined,
      prompt: API_SPEC_PROMPT.id,
    });
  });

  it('shows only the terraform adoption prompt on the terraform tab, without a toggle', async () => {
    const TERRAFORM_PROMPT = AGENT_SKILL_PROMPTS.find(({ id }) => id === 'terraform-import')!;
    render(<AgentSkillReference source="terraform-tab" />);

    expect(await screen.findByText(AGENT_SKILL_TERRAFORM_COPY.title)).toBeInTheDocument();
    expect(screen.queryByText(AGENT_SKILL_DEFAULT_COPY.title)).not.toBeInTheDocument();
    expect(screen.getByText(new RegExp(TERRAFORM_PROMPT.prompt.slice(0, 60)))).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    for (const { id, prompt } of AGENT_SKILL_PROMPTS) {
      if (id !== 'terraform-import') {
        expect(screen.queryByText(prompt)).not.toBeInTheDocument();
      }
    }
  });

  it('tracks clicking the repository link', async () => {
    const { user } = render(<AgentSkillReference source={SOURCE} />);

    const link = await screen.findByRole('link', { name: /View the skill on GitHub/ });
    await user.click(link);

    expect(trackAgentSkillLinkClicked).toHaveBeenCalledWith({ source: SOURCE });
  });

  it('does not ask for feedback before an install command has been copied', async () => {
    render(<AgentSkillReference source={SOURCE} />);

    await screen.findByText(AGENT_SKILL_DEFAULT_COPY.title);
    expect(screen.queryByText('Did the skill help?')).not.toBeInTheDocument();
  });

  it('asks for feedback on a return visit after an install command was copied', async () => {
    localStorage.setItem(AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY, 'true');
    render(<AgentSkillReference source={SOURCE} />);

    expect(await screen.findByText('Did the skill help?')).toBeInTheDocument();
  });

  describe('collapsible mode', () => {
    it('starts collapsed and only tracks the view on first expand', async () => {
      const { user } = render(<AgentSkillReference source={SOURCE} collapsible />);

      const toggle = await screen.findByText(AGENT_SKILL_DEFAULT_COPY.title);
      expect(screen.queryByText(AGENT_SKILL_INSTALL_COMMANDS[0].command)).not.toBeInTheDocument();
      expect(trackAgentSkillSectionViewed).not.toHaveBeenCalled();

      await user.click(toggle);
      expect(await screen.findByText(AGENT_SKILL_INSTALL_COMMANDS[0].command)).toBeInTheDocument();
      expect(trackAgentSkillSectionViewed).toHaveBeenCalledTimes(1);
      expect(trackAgentSkillSectionViewed).toHaveBeenCalledWith({ source: SOURCE });

      // collapsing and re-expanding does not double-count the view
      await user.click(toggle);
      await user.click(toggle);
      expect(trackAgentSkillSectionViewed).toHaveBeenCalledTimes(1);
    });

    it('shows the feedback ask outside the collapse after an install command was copied', async () => {
      localStorage.setItem(AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY, 'true');
      render(<AgentSkillReference source={SOURCE} collapsible />);

      expect(await screen.findByText('Did the skill help?')).toBeInTheDocument();
      expect(screen.queryByText(AGENT_SKILL_INSTALL_COMMANDS[0].command)).not.toBeInTheDocument();
    });
  });
});
