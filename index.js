const fs = require('fs')
const { parse } = require('csv-parse')

class UnauthorizedException extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
  }
}

class NextBrain {
  constructor({
    accessToken,
    backendUrl = 'https://api.nextbrain.ai',
    isApp = false,
  }) {
    this.accessToken = accessToken
    this.backendUrl = backendUrl
    this.isApp = isApp
  }

  async loadCsv(filePath, options = { delimiter: ',' }) {
    return await new Promise((resolve, reject) => {
      const parser = parse(options)
      const rows = []

      fs.createReadStream(filePath)
        .on('error', (err) => reject(err))
        .pipe(parser)

      parser.on('readable', () => {
        let record
        while ((record = parser.read())) {
          rows.push(record)
        }
      })

      parser.on('end', () => {
        resolve(rows)
      })
    })
  }

  async getAccuracy(modelId) {
    let response

    if (this.isApp) {
      response = await fetch(`${this.backendUrl}/app/acc/${modelId}`, {
        headers: {
          access_token: this.accessToken,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
    } else {
      response = await fetch(`${this.backendUrl}/model/acc_token/${modelId}`, {
        method: 'POST',
        body: JSON.stringify({
          access_token: this.accessToken,
        }),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    return await response.json()
  }

  async waitModel(modelId, waitImported = true) {
    while (true) {
      let response

      if (this.isApp) {
        response = await fetch(`${this.backendUrl}/app/status/${modelId}`, {
          headers: {
            access_token: this.accessToken,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
      } else {
        response = await fetch(
          `${this.backendUrl}/model/status_token/${modelId}`,
          {
            method: 'POST',
            body: JSON.stringify({
              access_token: this.accessToken,
            }),
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        )
      }

      if (response.status === 401) {
        throw new UnauthorizedException()
      }

      const data = await response.json()

      if (waitImported) {
        if (data['dataset_status'] === 'imported') {
          return
        } else if (data['dataset_status'] === 'error') {
          throw new Error('Error importing model')
        }
      } else {
        if (data['status'] === 'trained') {
          return
        } else if (data['status'] === 'error') {
          throw new Error('Error training model')
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  async uploadModel(table) {
    let response

    if (this.isApp) {
      response = await fetch(`${this.backendUrl}/app/import_matrix`, {
        method: 'POST',
        body: JSON.stringify({
          matrix: table,
        }),
        headers: {
          access_token: this.accessToken,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
    } else {
      response = await fetch(`${this.backendUrl}/csv/import_matrix_token`, {
        method: 'POST',
        body: JSON.stringify({
          access_token: this.accessToken,
          matrix: table,
        }),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    const data = await response.json()
    const modelId = data.model.id
    await this.waitModel(modelId)
    return modelId
  }

  async trainModel(modelId, target, isLightning = false) {
    let url, data
    if (this.isApp) {
      url = `${this.backendUrl}/app/train`
      data = {
        target: target,
        model_id: modelId,
        is_lightning: isLightning,
      }
    } else {
      url = `${this.backendUrl}/model/train_token`
      data = {
        access_token: this.accessToken,
        target: target,
        model_id: modelId,
        is_lightning: isLightning,
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          access_token: this.accessToken,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 401) {
        throw new UnauthorizedException()
      }

      await this.waitModel(modelId, false)
    } catch (error) {
      console.error(error)
    }
  }

  async predictModel(modelId, table) {
    const header = table[0]
    const rows = table.slice(1)
    let response
    if (this.isApp) {
      response = await fetch(`${this.backendUrl}/app/predict/${modelId}`, {
        method: 'POST',
        headers: {
          access_token: this.accessToken,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header: header,
          rows: rows,
        }),
      })
    } else {
      response = await fetch(
        `${this.backendUrl}/model/predict_token/${modelId}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: this.accessToken,
            header: header,
            rows: rows,
          }),
        },
      )
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    return await response.json()
  }

  async randomPredict(modelId) {
    let response
    if (this.isApp) {
      response = await fetch(
        `${this.backendUrl}/app/random_predict/${modelId}`,
        {
          headers: {
            access_token: this.accessToken,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      )
    } else {
      response = await fetch(
        `${this.backendUrl}/model/random_predict_token/${modelId}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: this.accessToken,
          }),
        },
      )
    }
    if (response.status === 401) {
      throw new UnauthorizedException()
    }
    return await response.json()
  }

  async getPredictColumns(modelId) {
    let response
    if (this.isApp) {
      response = await fetch(
        `${this.backendUrl}/app/predict_columns/${modelId}`,
        {
          headers: {
            access_token: this.accessToken,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      )
    } else {
      response = await fetch(
        `${this.backendUrl}/model/predict_columns_token/${modelId}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: this.accessToken,
          }),
        },
      )
    }
    if (response.status === 401) {
      throw new UnauthorizedException()
    }
    return await response.json()
  }

  async uploadAndPredict(table, predictTable, target, isLightning = false) {
    const modelId = await this.uploadModel(table)
    await this.trainModel(modelId, target, isLightning)
    const predictions = await this.predictModel(modelId, predictTable)
    return [modelId, predictions]
  }

  async deleteModel(modelId) {
    let response

    if (this.isApp) {
      response = await fetch(`${this.backendUrl}/app/delete_model/${modelId}`, {
        method: 'POST',
        headers: {
          access_token: this.accessToken,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
    } else {
      response = await fetch(
        `${this.backendUrl}/model/delete_model_token/${modelId}`,
        {
          method: 'POST',
          headers: {
            access_token: this.accessToken,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: this.accessToken,
          }),
        },
      )
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    return
  }
}

module.exports = {
  NextBrain,
  UnauthorizedException,
}
