export function AuthSkeleton({label='Loading your account',heading=true}:{label?:string;heading?:boolean}){
 return <div className="auth-skeleton" role="status" aria-label={label}>
  <div aria-hidden="true">{heading&&<span className="auth-skeleton-heading"/>}<span className="auth-skeleton-copy"/><span className="auth-skeleton-field"/><span className="auth-skeleton-field"/><span className="auth-skeleton-button"/></div>
  <span className="sr-only">{label}</span>
 </div>;
}
