import React from 'react';
import 'metismenu';
import Progress from '../common/Progress';
import Navigation from '../common/Navigation';
import Footer from '../common/Footer';
import TopHeader from '../common/TopHeader';
import { correctHeight, detectBody } from './Helpers';
import { SubRoutes } from '@/router/Router.jsx'

class Main extends React.Component {

  render() {
    let wrapperClass = "gray-bg " + this.props.location.pathname;
    return (
      <div id="wrapper">
        <Progress />
        <Navigation location={this.props.location} />

        <div id="page-wrapper" className={wrapperClass}>

          <TopHeader />

          {SubRoutes(this.props.routes)}

          <Footer />

        </div>

      </div>

    )
  }

  componentDidMount() {
    correctHeight();
    detectBody();
    // Run correctHeight function on resize window event
    $(window).on("resize", function () {
      correctHeight();
      detectBody();
    });

    // Correct height of wrapper after metisMenu animation.
    $('.metismenu a').click(() => {
      setTimeout(() => {
        correctHeight();
      }, 300)
    });
  }
}

export default Main
