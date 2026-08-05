import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { AgentSkillReference } from './AgentSkillReference';
import { AGENT_SKILL_INSTALL_COMMANDS, AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY } from './AgentSkillReference.constants';

jest.mock('features/tracking/agentSkillEvents', () => ({
  trackAgentSkillSectionViewed: jest.fn(),
  trackAgentSkillLinkClicked: jest.fn(),
  trackAgentSkillInstallCommandCopied: jest.fn(),
}));

import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
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
  });

  it('tracks clicking the repository link', async () => {
    const { user } = render(<AgentSkillReference source={SOURCE} />);

    const link = await screen.findByRole('link', { name: /View the skill on GitHub/ });
    await user.click(link);

    expect(trackAgentSkillLinkClicked).toHaveBeenCalledWith({ source: SOURCE });
  });

  it('does not ask for feedback before an install command has been copied', async () => {
    render(<AgentSkillReference source={SOURCE} />);

    await screen.findByText('Author checks with your AI coding agent');
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

      const toggle = await screen.findByText('Author checks with your AI coding agent');
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
