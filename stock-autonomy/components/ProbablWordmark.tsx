import { BASE_PATH } from '@/lib/config';

export default function ProbablWordmark() {
  return (
    <div className="wordmark-box">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE_PATH}/probabl.svg`} alt="Probabl" className="wordmark-img" />
    </div>
  );
}
