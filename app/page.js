/*
  POKEVAULT - ROOT REDIRECT
  ------------------------
  Redirects the base URL (/) to the home/landing page (/home).
*/

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}