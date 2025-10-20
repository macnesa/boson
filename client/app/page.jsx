import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the hero section (page 1)
  redirect('/home');
}
