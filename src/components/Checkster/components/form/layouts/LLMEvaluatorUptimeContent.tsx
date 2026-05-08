import React from 'react';

import { CheckType } from 'types';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormTimeoutField } from '../FormTimeoutField';

export function LLMEvaluatorUptimeContent() {
  return (
    <SectionContent>
      <div>
        Uptime is reported as <code>probe_success</code>: <code>1</code> when every criterion passes,{' '}
        <code>0</code> otherwise. Per-criterion pass/fail is also exported as{' '}
        <code>probe_llm_eval_criterion_passed</code>.
      </div>
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP[CheckType.LlmEvaluator]} />
    </SectionContent>
  );
}
