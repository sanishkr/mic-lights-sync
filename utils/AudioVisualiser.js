import React, { Component } from 'react';

class AudioVisualiser extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidUpdate() {
    this.draw();
  }

  draw() {
    const { audioData, cb, sensitivity } = this.props;
    const canvas = this.canvas.current;
    const height = canvas.height;
    const width = canvas.width;
    const context = canvas.getContext('2d');
    let x = 0;
    let values = 0;
    let arr = []
    const sliceWidth = (width * 1.0) / audioData.length;

    context.lineWidth = 1.25;
    context.strokeStyle = '#221100';
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.moveTo(0, height / 2);
    for (const item of audioData) {
      const y = (item / 255.0) * height;
      context.lineTo(x, y);
      x += sliceWidth;
      values += item;
      arr.push(parseInt(y))
    }

    const average = parseInt(values / audioData.length);
    const max = Math.max(...audioData);
    const diff = max - average;
    // console.log(max - average);
    if(diff > (100 * sensitivity)) {
      cb(diff)
    }

    context.lineTo(x, height / 2);
    context.stroke();
  }

  render() {
    return <canvas style={{position: 'absolute'}} width={window.innerWidth * 0.8} height="400" ref={this.canvas} />;
  }
}

export default AudioVisualiser;
