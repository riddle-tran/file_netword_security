import React from 'react';
import { Route, Redirect } from 'react-router-dom'
import store from '@/store/store'
import Loadable from 'react-loadable';

import LoadingSpinner from '@/components/common/LoadingSpinner'


const Main = Loadable({
  loader: () => import('@/components/layouts/Main'),
  loading: LoadingSpinner,
});
const Login = Loadable({
  loader: () => import('@/components/Login.jsx'),
  loading: LoadingSpinner,
});
const BoardList = Loadable({
  loader: () => import('@/components/BoardList.jsx'),
  loading: LoadingSpinner,
});
const EditBoard = Loadable({
  loader: () => import('@/components/uploadFile/EditBoard.jsx'),
  loading: LoadingSpinner,
});
const Share = Loadable({
  loader: () => import('@/components/Share.jsx'),
  loading: LoadingSpinner,
});
const DeletedBoards = Loadable({
  loader: () => import('@/components/DeletedBoards.jsx'),
  loading: LoadingSpinner,
});

const routes = [
  {
    path: "/(|app)/",
    component: Main,
    isAuth: true,
    routes: [
      {
        path: "/app/share",
        component: Share,
      },
      {
        path: "/app/edit-board/:boardId",
        component: EditBoard,
        isAuth: true
      },
      {
        path: "/app/deleted-boards",
        component: DeletedBoards,
      },
      {
        path: "/app/boards",
        component: BoardList,
      }
    ]
  },
  {
    path: "/login",
    component: Login,
    exact: true
  },
  {
    path: "/i/:nonce",
    component: Login,
    exact: true
  },
]

const SubRoutes = routes => (
  routes.map((route, index) => RouteWithSubRoutes(route, index))
);

const RouteWithSubRoutes = (route, index) => {
  if (route.isAuth) {
    return <Route key={index} {...route} component={null} render={props => (
      (store.getState().isLogged)
        ? <route.component {...props} routes={route.routes} />
        : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
    )} />
  }
  else return <Route key={index} {...route} component={null} render={props => <route.component {...props} routes={route.routes} />} />
};

const AppRouter = SubRoutes(routes)

export default AppRouter
export { SubRoutes }
