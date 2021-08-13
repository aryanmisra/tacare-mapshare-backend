"use strict";
/**
 * @file
 * This file provides common controllers.
 * @author DocuSign
 */
const fs = require("fs"), dsConfig = require("../dsconfig.js").config, documentationTopic = "auth-code-grant-node";
const commonControllers = exports;
/**
 * Home page for this application
 */
commonControllers.indexController = (req, res) => {
    res.render("pages/index", {
        title: "Home",
        documentation: dsConfig.documentation + documentationTopic,
        showDoc: dsConfig.documentation,
    });
};
commonControllers.mustAuthenticateController = (req, res) => {
    res.render("pages/ds_must_authenticate", { title: "Authenticate with DocuSign" });
};
/**
 * Display parameters after DS redirect to the application
 * after an embedded signing ceremony, etc
 * @param {object} req Request object
 * @param {object} res Result object
 */
commonControllers.returnController = (req, res) => {
    let event = req.query && req.query.event, state = req.query && req.query.state, envelopeId = req.query && req.query.envelopeId;
    res.render("pages/ds_return", {
        title: "Return from DocuSign",
        event: event,
        envelopeId: envelopeId,
        state: state,
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uQ29udHJvbGxlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY29tbW9uQ29udHJvbGxlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7QUFFSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQ3RCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQzNDLGtCQUFrQixHQUFHLHNCQUFzQixDQUFDO0FBQzlDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0FBRWxDOztHQUVHO0FBQ0gsaUJBQWlCLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFO1FBQ3hCLEtBQUssRUFBRSxNQUFNO1FBQ2IsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEdBQUcsa0JBQWtCO1FBQzFELE9BQU8sRUFBRSxRQUFRLENBQUMsYUFBYTtLQUNoQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixpQkFBaUIsQ0FBQywwQkFBMEIsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUFFLEVBQUUsS0FBSyxFQUFFLDRCQUE0QixFQUFFLENBQUMsQ0FBQztBQUNwRixDQUFDLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILGlCQUFpQixDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ2hELElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQ3RDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUNwQyxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFO1FBQzVCLEtBQUssRUFBRSxzQkFBc0I7UUFDN0IsS0FBSyxFQUFFLEtBQUs7UUFDWixVQUFVLEVBQUUsVUFBVTtRQUN0QixLQUFLLEVBQUUsS0FBSztLQUNiLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyJ9