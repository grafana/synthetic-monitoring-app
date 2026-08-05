import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { AgentSkillPicker } from './AgentSkillPicker';
import {
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AGENT_SKILL_PROMPTS,
  AGENT_SKILL_TOOLS,
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
  trackAgentSkillPromptCopied,
  trackAgentSkillSectionViewed,
  trackAgentSkillToolSelected,
} from 'features/tracking/agentSkillEvents';

const SOURCE = 'choose-check-type' as const;
const [CLAUDE_CODE, AGENT_SKILLS] = AGENT_SKILL_TOOLS;

describe('AgentSkillPicker', () => {
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

  it('renders a card per tool and no install steps until one is selected', async () => {
    render(<AgentSkillPicker source={SOURCE} />);

    for (const { name } of AGENT_SKILL_TOOLS) {
      expect(await screen.findByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
    }
    expect(screen.queryByText(/Install the skill/)).not.toBeInTheDocument();
    expect(trackAgentSkillSectionViewed).not.toHaveBeenCalled();
  });

  it('shows the install steps for the selected tool and tracks the selection', async () => {
    const { user } = render(<AgentSkillPicker source={SOURCE} />);

    await user.click(await screen.findByRole('button', { name: new RegExp(CLAUDE_CODE.name) }));

    expect(await screen.findByText(CLAUDE_CODE.installCommand)).toBeInTheDocument();
    expect(screen.queryByText(AGENT_SKILLS.installCommand)).not.toBeInTheDocument();
    expect(trackAgentSkillToolSelected).toHaveBeenCalledWith({ source: SOURCE, tool: CLAUDE_CODE.id });
    expect(trackAgentSkillSectionViewed).toHaveBeenCalledTimes(1);

    // switching tools swaps the install command but does not re-count the view
    await user.click(screen.getByRole('button', { name: new RegExp(AGENT_SKILLS.name) }));
    expect(await screen.findByText(AGENT_SKILLS.installCommand)).toBeInTheDocument();
    expect(trackAgentSkillSectionViewed).toHaveBeenCalledTimes(1);
  });

  it('tracks copying the install command and remembers it for feedback', async () => {
    const { user } = render(<AgentSkillPicker source={SOURCE} />);

    await user.click(await screen.findByRole('button', { name: new RegExp(CLAUDE_CODE.name) }));
    const copyButtons = await screen.findAllByRole('button', { name: 'Copy to clipboard' });
    await user.click(copyButtons[0]);

    expect(trackAgentSkillInstallCommandCopied).toHaveBeenCalledWith({
      source: SOURCE,
      command: CLAUDE_CODE.trackingId,
    });
    expect(JSON.parse(localStorage.getItem(AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY) ?? 'false')).toBe(true);
    // the feedback ask must wait for a return visit, not appear mid-session
    expect(screen.queryByText('Did the skill help?')).not.toBeInTheDocument();
  });

  it('swaps the example prompt via the toggle and tracks which variant is copied', async () => {
    const [SITE_PROMPT, API_SPEC_PROMPT] = AGENT_SKILL_PROMPTS;
    const { user } = render(<AgentSkillPicker source={SOURCE} />);

    await user.click(await screen.findByRole('button', { name: new RegExp(CLAUDE_CODE.name) }));
    expect(await screen.findByText(SITE_PROMPT.prompt)).toBeInTheDocument();
    expect(screen.queryByText(API_SPEC_PROMPT.prompt)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: API_SPEC_PROMPT.label }));
    expect(await screen.findByText(API_SPEC_PROMPT.prompt)).toBeInTheDocument();
    expect(screen.queryByText(SITE_PROMPT.prompt)).not.toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: 'Copy to clipboard' });
    await user.click(copyButtons[1]);
    expect(trackAgentSkillPromptCopied).toHaveBeenCalledWith({
      source: SOURCE,
      tool: CLAUDE_CODE.id,
      prompt: API_SPEC_PROMPT.id,
    });
  });

  it('resets the copied state when switching prompts or tools', async () => {
    const [SITE_PROMPT, API_SPEC_PROMPT] = AGENT_SKILL_PROMPTS;
    const { user } = render(<AgentSkillPicker source={SOURCE} />);

    await user.click(await screen.findByRole('button', { name: new RegExp(CLAUDE_CODE.name) }));
    const copyButtons = await screen.findAllByRole('button', { name: 'Copy to clipboard' });
    await user.click(copyButtons[1]);
    expect(screen.getByRole('button', { name: 'Copied to clipboard' })).toBeInTheDocument();

    // switching the prompt variant must not carry the "Copied" state over
    await user.click(screen.getByRole('radio', { name: API_SPEC_PROMPT.label }));
    expect(screen.queryByRole('button', { name: 'Copied to clipboard' })).not.toBeInTheDocument();

    // same when copying the install command and switching tools
    await user.click(screen.getAllByRole('button', { name: 'Copy to clipboard' })[0]);
    expect(screen.getByRole('button', { name: 'Copied to clipboard' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: new RegExp(AGENT_SKILLS.name) }));
    expect(screen.queryByRole('button', { name: 'Copied to clipboard' })).not.toBeInTheDocument();
    // the chosen prompt variant persists across tool switches
    expect(screen.getByText(API_SPEC_PROMPT.prompt)).toBeInTheDocument();
    expect(screen.queryByText(SITE_PROMPT.prompt)).not.toBeInTheDocument();
  });

  it('asks for feedback on a return visit after an install command was copied', async () => {
    localStorage.setItem(AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY, 'true');
    render(<AgentSkillPicker source={SOURCE} />);

    expect(await screen.findByText('Did the skill help?')).toBeInTheDocument();
  });
});
