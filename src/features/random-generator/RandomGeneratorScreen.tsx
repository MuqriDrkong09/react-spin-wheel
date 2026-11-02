import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useState, type SyntheticEvent } from 'react';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { RandomChoiceTool } from '@/features/random-generator/components/RandomChoiceTool';
import { RandomItemTool } from '@/features/random-generator/components/RandomItemTool';
import { RandomNameTool } from '@/features/random-generator/components/RandomNameTool';
import { RandomNumberTool } from '@/features/random-generator/components/RandomNumberTool';
import { TeamGeneratorTool } from '@/features/random-generator/components/TeamGeneratorTool';
import { TournamentTool } from '@/features/random-generator/components/TournamentTool';
import { GENERATOR_MESSAGES, GENERATOR_TOOL } from '@/features/random-generator/constants';
import type { GeneratorTool } from '@/features/random-generator/types';

export function RandomGeneratorScreen() {
  const [tool, setTool] = useState<GeneratorTool>(GENERATOR_TOOL.number);

  const changeTool = (_event: SyntheticEvent, value: GeneratorTool) => {
    setTool(value);
  };

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={GENERATOR_MESSAGES.title} description={GENERATOR_MESSAGES.description} />
        <Tabs
          value={tool}
          onChange={changeTool}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label={GENERATOR_MESSAGES.toolsLabel}
        >
          <Tab
            value={GENERATOR_TOOL.number}
            label={GENERATOR_MESSAGES.numberTab}
            id="generator-tab-number"
            aria-controls="generator-panel-number"
          />
          <Tab
            value={GENERATOR_TOOL.item}
            label={GENERATOR_MESSAGES.itemTab}
            id="generator-tab-item"
            aria-controls="generator-panel-item"
          />
          <Tab
            value={GENERATOR_TOOL.name}
            label={GENERATOR_MESSAGES.nameTab}
            id="generator-tab-name"
            aria-controls="generator-panel-name"
          />
          <Tab
            value={GENERATOR_TOOL.choice}
            label={GENERATOR_MESSAGES.choiceTab}
            id="generator-tab-choice"
            aria-controls="generator-panel-choice"
          />
          <Tab
            value={GENERATOR_TOOL.team}
            label={GENERATOR_MESSAGES.teamTab}
            id="generator-tab-team"
            aria-controls="generator-panel-team"
          />
          <Tab
            value={GENERATOR_TOOL.tournament}
            label={GENERATOR_MESSAGES.tournamentTab}
            id="generator-tab-tournament"
            aria-controls="generator-panel-tournament"
          />
        </Tabs>
        <Box
          role="tabpanel"
          id={`generator-panel-${tool}`}
          aria-labelledby={`generator-tab-${tool}`}
        >
          {tool === GENERATOR_TOOL.number ? <RandomNumberTool /> : null}
          {tool === GENERATOR_TOOL.item ? <RandomItemTool /> : null}
          {tool === GENERATOR_TOOL.name ? <RandomNameTool /> : null}
          {tool === GENERATOR_TOOL.choice ? <RandomChoiceTool /> : null}
          {tool === GENERATOR_TOOL.team ? <TeamGeneratorTool /> : null}
          {tool === GENERATOR_TOOL.tournament ? <TournamentTool /> : null}
        </Box>
      </Stack>
    </PageContainer>
  );
}
