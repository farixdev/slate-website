import { Hero } from '../sections/Hero';
import {
  CtaBand,
  Faq,
  Features,
  HowItWorks,
  Pillars,
  Security,
  Specs,
} from '../sections/HomeSections';
import { useLatestRelease } from '../lib/useReleases';
import { usePageTitle } from '../lib/usePageTitle';

export function Home() {
  usePageTitle('Slate — your phone is the trackpad');
  const { data: latest, loading } = useLatestRelease();

  return (
    <>
      <Hero latest={latest} loading={loading} />
      <Pillars />
      <Features />
      <Specs />
      <HowItWorks />
      <Security />
      <Faq />
      <CtaBand latest={latest} />
    </>
  );
}
