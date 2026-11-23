import SignIn from './sign-in';

export default function Home() {
  return <main id="main" className="entrance">
    <div className="intro"><p className="eyebrow">APEX NEXUS</p><h1>Executive Oversight Platform</h1><p className="lead">A clear record of directives, progress and decisions.</p><p>For authorised teams responsible for reporting, review and executive oversight.</p><div className="links"><a href="/about">About APEX NEXUS</a><a href="/privacy">Privacy notice</a></div></div>
    <SignIn supportEmail={process.env.NEXUS_SUPPORT_EMAIL || ''}/>
  </main>;
}
