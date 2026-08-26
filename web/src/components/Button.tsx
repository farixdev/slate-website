import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Icon after the label instead of before — arrows read better trailing. */
  trailingIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function classes({ variant = 'secondary', size = 'md', className }: Common) {
  return ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ');
}

export function Button({
  onClick,
  type = 'button',
  disabled,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(props)} onClick={onClick} type={type} disabled={disabled}>
      {props.icon}
      <span>{props.children}</span>
      {props.trailingIcon}
    </button>
  );
}

/** An in-app route. */
export function ButtonLink({ to, ...props }: Common & { to: string }) {
  return (
    <Link className={classes(props)} to={to}>
      {props.icon}
      <span>{props.children}</span>
      {props.trailingIcon}
    </Link>
  );
}

/**
 * A plain anchor styled as a button — for anything that leaves the router.
 *
 * This is what every download uses. It must stay an `<a href>`: the href points
 * at `/api/downloads/:id/go`, which answers 302 with the GitHub asset, and the
 * browser follows it straight into a file download. Intercepting the click to
 * fetch or to `router.push` would break exactly the behaviour that matters.
 */
export function ButtonAnchor({
  href,
  external,
  ...props
}: Common &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    /** Opens in a new tab, with the referrer stripped. */
    external?: boolean;
  }) {
  return (
    <a
      className={classes(props)}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...(props.download !== undefined ? { download: props.download } : {})}
    >
      {props.icon}
      <span>{props.children}</span>
      {props.trailingIcon}
    </a>
  );
}
