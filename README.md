# NextBrain
Convenient access to the [NextBrain](https://nextbrain.ai) API from Javascript

## Installation
```bash
npm install nextbrain
```

### All steps in one.
```javascript
import NextBrain from 'nextbrain'

const nb = new NextBrain({
  access_token: '<YOUR-ACCESS-TOKEN-HERE>',
})

const table = await nb.loadCsv('<PATH-TO-YOUR-TRAINING-CSV>')
const predictTable = await nb.loadCsv('<PATH-TO-YOUR-PREDICTING-CSV>')

let modelId, response = await nb.uploadAndPredict(table, predictTable, '<YOUR-TARGET-COLUMN>')
console.log('Response:', response)
```

### Step by step
```javascript
import NextBrain from 'nextbrain'

let nb = new NextBrain({
  access_token: '<YOUR-ACCESS-TOKEN-HERE>',
})

// You can create your custom table and predict table by your own from any source
let table = await nb.loadCsv('<PATH-TO-YOUR-TRAINING-CSV>')
// Upload the model to NextBrain service
let modelId = await nb.uploadModel(table)
// Train the model
// You can re-train a previous model
await nb.trainModel(modelId, '<YOUR-TARGET-COLUMN>')

let predictTable = await nb.loadCsv('<PATH-TO-YOUR-PREDICTING-CSV>')
// You can predict multiple using the same model (don't need to create a new model each time)
let response = await nb.predictModel(modelId, predictTable[0], predictTable[1:])
console.log('Response:', response)
```
