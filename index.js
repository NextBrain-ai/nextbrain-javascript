class UnauthorizedException extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
  }
}

export default class NextBrain {
  constructor({access_token, backend_url='https://api.nextbrain.ai', is_app=false}) {
    this.access_token = access_token
    this.backend_url = backend_url
    this.is_app = is_app
  }

  async get_accuracy(model_id) {
    let response

    if (this.is_app) {
      response = await fetch(`${this.backend_url}/app/acc/${model_id}`, {
        headers: {
          access_token: this.access_token,
        },
      })
    } else {
      response = await fetch(
        `${this.backend_url}/model/acc_token/${model_id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            access_token: this.access_token,
          }),
        },
      )
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    return await response.json()
  }

  async wait_model(model_id, wait_imported = true) {
    while (true) {
      let response

      if (this.is_app) {
        response = await fetch(`${this.backend_url}/app/status/${model_id}`, {
          headers: {
            access_token: this.access_token,
          },
        })
      } else {
        response = await fetch(
          `${this.backend_url}/model/status_token/${model_id}`,
          {
            method: 'POST',
            body: JSON.stringify({
              access_token: this.access_token,
            }),
          },
        )
      }

      if (response.status === 401) {
        throw new UnauthorizedException()
      }

      const data = await response.json()

      if (wait_imported) {
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

  async upload_model(table) {
    let response

    if (this.is_app) {
      response = await fetch(`${this.backend_url}/app/import_matrix`, {
        method: 'POST',
        body: JSON.stringify({
          matrix: table,
        }),
        headers: {
          access_token: this.access_token,
        },
      })
    } else {
      response = await fetch(`${this.backend_url}/csv/import_matrix_token`, {
        method: 'POST',
        body: JSON.stringify({
          access_token: this.access_token,
          matrix: table,
        }),
      })
    }

    if (response.status === 401) {
      throw new UnauthorizedException()
    }

    const data = await response.json()
    const model_id = data.model.id
    await this.wait_model(model_id)
    return model_id
  }

  async train_model(model_id, target, is_lightning = false) {
    let url, data
    if (this.is_app) {
      url = `${this.backend_url}/app/train`
      data = {
        target: target,
        model_id: model_id,
        is_lightning: is_lightning,
      }
    } else {
      url = `${this.backend_url}/model/train_token`
      data = {
        access_token: this.access_token,
        target: target,
        model_id: model_id,
        is_lightning: is_lightning,
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.access_token,
        },
        body: JSON.stringify(data),
      })

      if (response.status === 401) {
        throw new UnauthorizedException()
      }

      await this.wait_model(model_id, false)
    } catch (error) {
      console.error(error)
    }
  }

  async predict_model(model_id, header, rows) {
    let response;
    if (this.is_app) {
      response = await fetch(`${this.backend_url}/app/predict/${model_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': this.access_token,
        },
        body: JSON.stringify({
          header: header,
          rows: rows,
        }),
      });
    } else {
      response = await fetch(`${this.backend_url}/model/predict_token/${model_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.access_token,
          header: header,
          rows: rows,
        }),
      });
    }

    if (response.status === 401) {
      throw new UnauthorizedException();
    }

    return await response.json();
  }

  async upload_and_predict(table, predict_table, target) {
    const model_id = await this.upload_model(table);
    await this.train_model(model_id, target);
    const predictions = await this.predict_model(model_id, predict_table[0], predict_table.slice(1));
    return [model_id, predictions];
  }

  async delete_model(model_id) {
    let response;

    if (this.is_app) {
      response = await fetch(`${this.backend_url}/app/delete_model/${model_id}`, {
        method: 'POST',
        headers: {
          'access_token': this.access_token
        }
      });
    } else {
      response = await fetch(`${this.backend_url}/model/delete_model_token/${model_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': this.access_token
        },
        body: JSON.stringify({
          'access_token': this.access_token
        })
      });
    }

    if (response.status === 401) {
      throw new UnauthorizedException();
    }

    return;
  }
}
