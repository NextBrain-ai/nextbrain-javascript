# NextBrain
Convenient access to the [NextBrain](https://nextbrain.ai) API from Javascript

## Installation
```bash
npm install nextbrain
```

### All steps in one.
```javascript
import NextBrain from 'nextbrain'

nb = NextBrain({
  access_token: '<YOUR-ACCESS-TOKEN-HERE>',
})

table = nb.load_csv('<PATH-TO-YOUR-TRAINING-CSV>')
predict_table = nb.load_csv('<PATH-TO-YOUR-PREDICTING-CSV>')

model_id, response = nb.upload_and_predict(table, predict_table, '<YOUR-TARGET-COLUMN>')
console.log('Response:', response)
```

### Step by step
```javascript
import NextBrain from 'nextbrain'

nb = NextBrain({
  access_token: '<YOUR-ACCESS-TOKEN-HERE>',
})

// You can create your custom table and predict table by your own from any source
table = nb.load_csv('<PATH-TO-YOUR-TRAINING-CSV>')
// Upload the model to NextBrain service
model_id = nb.upload_model(table)
// Train the model
// You can re-train a previous model
nb.train_model(model_id, '<YOUR-TARGET-COLUMN>')

predict_table = nb.load_csv('<PATH-TO-YOUR-PREDICTING-CSV>')
// You can predict multiple using the same model (don't need to create a new model each time)
response = nb.predict_model(model_id, predict_table[0], predict_table[1:])
console.log('Response:', response)
```
