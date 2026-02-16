import { getConfiguredProviders } from '@/lib/auth-config';
import SignInForm from './SignInForm';

export default function SignInPage() {
  const providers = getConfiguredProviders();
  return <SignInForm providers={providers} />;
}
