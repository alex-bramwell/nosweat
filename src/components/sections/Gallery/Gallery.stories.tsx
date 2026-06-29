import type { Meta, StoryObj } from '@storybook/react-vite';
import Gallery from './Gallery';
import { withProviders } from '../../../../.storybook/decorators';
import { mockBranding } from '../../../../.storybook/mockData';

const meta = {
  title: 'Sections/Gallery',
  component: Gallery,
  parameters: {
    layout: 'fullscreen',
    // Gallery only renders when visible_sections.gallery is true.
    tenant: { branding: { ...mockBranding, visible_sections: { ...mockBranding.visible_sections, gallery: true } } },
  },
  decorators: [withProviders],
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const Carousel: Story = {
  parameters: {
    tenant: {
      branding: {
        ...mockBranding,
        gallery_layout: 'carousel',
        visible_sections: { ...mockBranding.visible_sections, gallery: true },
      },
    },
  },
};
