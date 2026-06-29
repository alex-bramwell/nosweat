import type { Meta, StoryObj } from '@storybook/react-vite';
import FeatureDisableModal from './FeatureDisableModal';
import { getFeatureDefinition } from '../../config/features';

const dayPasses = getFeatureDefinition('day_passes')!;
const classBooking = getFeatureDefinition('class_booking')!;

const meta = {
  title: 'Gym Admin/FeatureDisableModal',
  component: FeatureDisableModal,
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    onClose: () => {},
    onConfirm: () => {},
    feature: classBooking,
    dependentFeatures: [dayPasses],
    isLoading: false,
  },
} satisfies Meta<typeof FeatureDisableModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDependents: Story = {};
export const NoDependents: Story = { args: { feature: dayPasses, dependentFeatures: [] } };
export const Loading: Story = { args: { isLoading: true } };
