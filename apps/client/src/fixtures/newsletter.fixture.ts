import type { NewsletterDoc } from '../types/newsletter';

export const FIXTURE_DOC: NewsletterDoc = {
  header: { presetId: 'infineon-default', variables: {} },
  footer: { presetId: 'infineon-default', variables: {} },
  globalStyles: {
    fontFamily:      'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    contentWidth:    600,
    primaryColor:    '#0066cc',
  },
  rows: [
    {
      id:         'fixture-row-1col',
      layoutType: '1col',
      slots:      [{ id: 'fixture-slot-1col-1', element: null }],
    },
    {
      id:         'fixture-row-2col',
      layoutType: '2col',
      slots:      [
        { id: 'fixture-slot-2col-1', element: null },
        { id: 'fixture-slot-2col-2', element: null },
      ],
    },
    {
      id:         'fixture-row-3col',
      layoutType: '3col',
      slots:      [
        { id: 'fixture-slot-3col-1', element: null },
        { id: 'fixture-slot-3col-2', element: null },
        { id: 'fixture-slot-3col-3', element: null },
      ],
    },
    {
      id:         'fixture-row-slbr',
      layoutType: 'small-left-big-right',
      slots:      [
        { id: 'fixture-slot-slbr-1', element: null },
        { id: 'fixture-slot-slbr-2', element: null },
      ],
    },
    {
      id:         'fixture-row-blsr',
      layoutType: 'big-left-small-right',
      slots:      [
        { id: 'fixture-slot-blsr-1', element: null },
        { id: 'fixture-slot-blsr-2', element: null },
      ],
    },
  ],
};
