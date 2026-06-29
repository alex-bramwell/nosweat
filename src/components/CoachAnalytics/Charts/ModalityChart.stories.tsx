import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModalityChart } from './ModalityChart';

const meta = {
  title: 'Coach/Charts/ModalityChart',
  component: ModalityChart,
  args: {
    data: [
      { modality: 'Monostructural', percentage: 30, count: 9 },
      { modality: 'Gymnastics', percentage: 28, count: 8 },
      { modality: 'Weightlifting', percentage: 42, count: 12 },
    ],
  },
} satisfies Meta<typeof ModalityChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
