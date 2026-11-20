
import { createBrowserRouter } from 'react-router-dom';

import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import Protected from './features/auth/components/protected';
import { Home } from './features/interview/pages/Home';
import { Interview } from './features/interview/pages/interview';
import { CommunityFeed } from './features/experiences/pages/CommunityFeed';
import { ExperienceForm } from './features/experiences/pages/ExperienceForm';
import { ExperienceDetail } from './features/experiences/pages/ExperienceDetail';
import AppLayout from './Layout/AppLayout';
import { MyInterviews } from './features/interview/pages/MyInterviews';



export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/',
        element: <Protected><Home /></Protected>,
      },
      {
        path: '/interview/:interviewId',
        element: <Protected><Interview /></Protected>,
      },
      {
        path: '/reports',
        element: <Protected><MyInterviews /></Protected>,
      },
      {
        path: '/experiences',
        element: <Protected><CommunityFeed /></Protected>,
      },
      {
        path: '/experiences/new',
        element: <Protected><ExperienceForm /></Protected>,
      },
      {
        path: '/experiences/:experienceId',
        element: <Protected><ExperienceDetail /></Protected>,
      },
    ],
  },
]);
