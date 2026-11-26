import * as React from 'react';
import { SectionHeading } from '@branchleft/components';

export interface LegalSectionProps {
  /** Section id: names the section for assistive tech and anchors its heading. */
  id: string;
  /** Heading text. */
  title: string;
  children: React.ReactNode;
}

/** A top-level section of a legal page: a labelled section with its h2 heading. */
export function LegalSection({ id, title, children }: LegalSectionProps): React.JSX.Element {
  return (
    <section aria-labelledby={id}>
      <SectionHeading as="h2" anchor={id}>
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}
