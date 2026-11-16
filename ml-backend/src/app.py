from flask import Flask, jsonify, request
import pandas as pd

from cybervault_pipeline import (
    ModelsUnavailableError,
    model_status,
    predict_flow
)

from database import (
    initialize_database,
    save_alert,
    get_alerts,
    get_alert,
    update_alert_status
)


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

# Initialize SQLite database
initialize_database()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    status = model_status()

    return jsonify({
        "status": "online",
        "service": "CyberVault API",
        "models_loaded": status["loaded"],
        "missing_artifacts": [
            item["name"] for item in status["missing"]
        ]
    })


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.route("/model-info", methods=["GET"])
def model_info():

    status = model_status()

    return jsonify({
        "binary_model": "Random Forest" if status["loaded"] else "not loaded",
        "multiclass_model": "Random Forest" if status["loaded"] else "not loaded",
        "risk_engine": "Rule-Based Risk & Severity Engine",
        "status": "loaded" if status["loaded"] else "models_missing",
        "models_dir": status["models_dir"],
        "processed_dir": status["processed_dir"],
        "missing_artifacts": len(status["missing"])
    })


# ============================================================
# PREDICT THREAT
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # ----------------------------------------------------
        # READ JSON REQUEST
        # ----------------------------------------------------

        data = request.get_json()

        if data is None:

            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400


        # ----------------------------------------------------
        # EXTRACT FLOW DATA
        # ----------------------------------------------------

        # Supported formats:
        #
        # 1. {"flow": {...}}
        #
        # 2. {...}
        #
        # 3. [{...}]
        #

        if isinstance(data, dict):

            if "flow" in data:

                flow_data = data["flow"]

            else:

                flow_data = data


        elif isinstance(data, list):

            if len(data) == 0:

                return jsonify({
                    "success": False,
                    "error": "Empty flow data"
                }), 400

            flow_data = data[0]


        else:

            return jsonify({
                "success": False,
                "error": "Invalid JSON format"
            }), 400


        # ----------------------------------------------------
        # VERIFY FLOW FORMAT
        # ----------------------------------------------------

        if not isinstance(flow_data, dict):

            return jsonify({
                "success": False,
                "error": "Flow data must be a JSON object"
            }), 400


        # ----------------------------------------------------
        # CREATE DATAFRAME
        # ----------------------------------------------------

        flow_df = pd.DataFrame([flow_data])


        # ----------------------------------------------------
        # RUN CYBERVAULT ML PIPELINE
        # ----------------------------------------------------

        try:

            prediction = predict_flow(flow_df)

        except ModelsUnavailableError as e:

            return jsonify({

                "success": False,

                "error": str(e),

                "missing": e.missing

            }), 503


        # ----------------------------------------------------
        # predict_flow() RETURNS A LIST
        #
        # Example:
        #
        # [
        #     {
        #         "threat": "ATTACK",
        #         "attack_type": "DoS Hulk",
        #         ...
        #     }
        # ]
        #
        # Since this API request contains one flow,
        # take the first prediction.
        # ----------------------------------------------------

        if isinstance(prediction, list):

            if len(prediction) == 0:

                return jsonify({
                    "success": False,
                    "error": "No prediction generated"
                }), 500

            prediction = prediction[0]


        # ----------------------------------------------------
        # FINAL SAFETY CHECK
        # ----------------------------------------------------

        if not isinstance(prediction, dict):

            return jsonify({
                "success": False,
                "error": "Prediction format is invalid"
            }), 500


        # ----------------------------------------------------
        # SAVE ALERT TO DATABASE
        # ----------------------------------------------------

        alert_id = save_alert(prediction)


        # Add database ID to prediction
        prediction["alert_id"] = alert_id


        # ----------------------------------------------------
        # RETURN RESULT
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "prediction": prediction

        })


    except Exception as e:

        # ----------------------------------------------------
        # ERROR HANDLING
        # ----------------------------------------------------

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# GET ALL ALERTS
# ============================================================

@app.route("/alerts", methods=["GET"])
def alerts():

    try:

        alerts_data = get_alerts()

        return jsonify({

            "success": True,

            "count": len(alerts_data),

            "alerts": alerts_data

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# GET SINGLE ALERT
# ============================================================

@app.route("/alerts/<int:alert_id>", methods=["GET"])
def single_alert(alert_id):

    try:

        alert = get_alert(alert_id)


        if alert is None:

            return jsonify({

                "success": False,

                "error": "Alert not found"

            }), 404


        return jsonify({

            "success": True,

            "alert": alert

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# UPDATE ALERT STATUS
# ============================================================

@app.route("/alerts/<int:alert_id>/status", methods=["PUT"])
def update_status(alert_id):

    try:

        data = request.get_json()


        if not data or "status" not in data:

            return jsonify({

                "success": False,

                "error": "Status is required"

            }), 400


        status = str(data["status"]).upper()


        # Allowed incident states
        allowed_statuses = [

            "NEW",

            "INVESTIGATING",

            "RESOLVED"

        ]


        if status not in allowed_statuses:

            return jsonify({

                "success": False,

                "error": "Invalid status",

                "allowed_statuses": allowed_statuses

            }), 400


        updated = update_alert_status(

            alert_id,

            status

        )


        if not updated:

            return jsonify({

                "success": False,

                "error": "Alert not found"

            }), 404


        return jsonify({

            "success": True,

            "alert_id": alert_id,

            "status": status

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# START CYBERVAULT API
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("CYBERVAULT API")
    print("=" * 60)

    print("Server: http://127.0.0.1:5000")

    print("Health: http://127.0.0.1:5000/health")

    print("Model:  http://127.0.0.1:5000/model-info")

    print("Predict: POST http://127.0.0.1:5000/predict")

    print("Alerts:  http://127.0.0.1:5000/alerts")

    print("Alert:   GET /alerts/<id>")

    print("Status:  PUT /alerts/<id>/status")

    print("=" * 60)
    print()


    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )