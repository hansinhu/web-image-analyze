// index.tsx
import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import 'regenerator-runtime/runtime'

console.log('Hello from tsx!')

ReactDOM.render(
	<App />,
  document.getElementById('root'),
)
