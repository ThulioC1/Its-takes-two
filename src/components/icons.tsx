import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 20.5L-2.5 9.2C-4.4 7 -3.6 3.6 0.2 2.3C2.2 1.6 4.4 2.1 6 3.7L12 9.4L18 3.7C19.6 2.1 21.8 1.6 23.8 2.3C27.6 3.6 28.4 7 26.5 9.2L12.22 20.5Z" />
      <path d="m12.22 20.5 5.7-4.4c2.5-2 1.6-5.8-1.4-6.8-2-.7-4.2-0.2-5.8 1.4L9.22 13.9" />
    </svg>
  ),
};
