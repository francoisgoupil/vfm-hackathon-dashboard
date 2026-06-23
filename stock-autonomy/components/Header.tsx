import { BASE_PATH, CONFIG } from '@/lib/config';
import ProbablWordmark from './ProbablWordmark';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <ProbablWordmark />
      </div>

      <div className="header-center">
        <h1 className="header-title serif">{CONFIG.WORKSHOP_TITLE}</h1>
        <p className="header-sub">{CONFIG.WORKSHOP_SUBTITLE}</p>
      </div>

      <div className="header-right">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE_PATH}/totalenergies.svg`} alt="TotalEnergies" className="partner-logo" />
      </div>
    </header>
  );
}
