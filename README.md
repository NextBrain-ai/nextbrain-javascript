# NextBrain AI
Convenient access to the [NextBrain AI](https://nextbrain.ai) API from Javascript

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

// You can create your custom table and predict table by your own from any source
// It is a list of list, where the first row contains the header
// Example:
// [
//   [ Column1, Column2, Column3 ],
//   [       1,       2,       3 ],
//   [       4,       5,       6 ]
// ]
const table = await nb.loadCsv('<PATH-TO-YOUR-TRAINING-CSV>')
const predictTable = await nb.loadCsv('<PATH-TO-YOUR-PREDICTING-CSV>')

const [modelId, response] = await nb.uploadAndPredict(table, predictTable, '<YOUR-TARGET-COLUMN>')
console.log('Response:', response)

// You can optionally delete the model
await nb.deleteModel(modelId)
```

### Step by step
```javascript
import NextBrain from 'nextbrain'

const nb = new NextBrain({
  access_token: '<YOUR-ACCESS-TOKEN-HERE>',
})

// You can create your custom table and predict table by your own from any source
const table = await nb.loadCsv('<PATH-TO-YOUR-TRAINING-CSV>')
// Upload the model to NextBrain service
const modelId = await nb.uploadModel(table)
// Train the model
// You can re-train a previous model
await nb.trainModel(modelId, '<YOUR-TARGET-COLUMN>')

const predictTable = await nb.loadCsv('<PATH-TO-YOUR-PREDICTING-CSV>')
// You can predict multiple using the same model (don't need to create a new model each time)
const response = await nb.predictModel(modelId, predictTable)
console.log('Response:', response)
```

## Extra notes

Everytime you train, you can select an option to create lightning models. `isLightning` is an optional parameter that by default is set to `false` but can be overrided in `trainModel` and `uploadAndPredict`.

We also recommend that you investigate all the methods that the class provides you with to make the most of the functionalities we offer. For example, you can use the `getAccuracy` method to obtain all the information about the performance of your model.
