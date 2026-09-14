import { redirect } from 'next/navigation';

/** Figma route /auth → login choice */
export default function AuthAliasPage() {
  redirect('/app/login');
}
