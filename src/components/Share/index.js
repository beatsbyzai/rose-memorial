import React, { Component } from "react";
import Airtable from "airtable";
import request from "superagent";
import P5Wrapper from "react-p5-wrapper";
import sketch from "../../utils/p5/sketch";
import './style.css';

const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_API_KEY }).base("appZuPErukOoOExF9");

class Share extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dedication: "",
      optional_note: "",
      optional_photo: "",
      optional_link: "",
      rose_id: "",
      formHere: false,
    };
    this.handleDedication = this.handleDedication.bind(this);
    this.handleLink = this.handleLink.bind(this);
    this.handleNote = this.handleNote.bind(this);
    this.checkUploadResult = this.checkUploadResult.bind(this);
    this.showWidget = this.showWidget.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clickHandler =this.clickHandler.bind(this)
  }
  clickHandler() {
      document.getElementById('submission').classList.add('show');
      this.setState({formHere: true})
      document.getElementById("modal-button").style.display = "none";
  }
  handleDedication(event) {
    this.setState({ dedication: event.target.value });
  }
  handleLink(event) {
    this.setState({ optional_link: event.target.value });
  }

  handleNote(event) {
    this.setState({ optional_note: event.target.value });
  }

  checkUploadResult = (resultEvent) => {
    if (resultEvent.event === "success") {
      const nextState = Object.assign(this.state, {
        optional_photo: resultEvent.info.secure_url,
      });
      this.setState(nextState);
      document.getElementById("photo-image-preview").src = resultEvent.info.secure_url;
      document.getElementById("photo-image-preview").classList = "show";
      document.getElementById("inner-photo").textContent = "upload a different photo";
      document.getElementById("photo-button").classList = "submitted";
    }
  }

  showWidget = (myWidget) => {
    myWidget.open();
  }
  showSubmit(){
    document.getElementById('submit-button').classList.add('on');
    document.getElementById('canvas-holder').classList.add('on');
    document.getElementById('submission').classList.add('on');
    document.getElementById('review-button').classList.add('on');
  }
  handleSubmit(event) {
    //save roses in cloudinary
    const dataURI = document.getElementsByTagName("canvas")[0].getAttribute("data-uri");
    const url = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/upload`;

    request
      .post(url)
      .field("upload_preset", process.env.REACT_APP_PRESET_NAME)
      .field("file", dataURI)
      .field("multiple", "false")
      .end((error, response) => {
        const nextState = Object.assign(this.state, {rose_id: [response.body["public_id"], response.body["delete_token"]]});
        this.setState(nextState);

        //send info to airtable
        const {
          dedication,
          optional_note,
          optional_photo,
          rose_id,
          optional_link
        } = this.state;

        const submissionCallBack = (err, records) => {
          if (err) {
            console.error(err);
            return;
          }
          document.getElementById("submission").classList.add("submitted");
          const timeoutCallBack = () => {
            const url = `https://@api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/delete_by_token`;
            request
              .post(url)
              .field("token", rose_id[1])
              .end((error, response) => {
                if (error) {
                  console.log("done deletting");
                } else {
                  console.log(error);
                }
              });
            document.getElementById("submission").classList.add("submitted");
          };
          setTimeout(timeoutCallBack, 2000);
        };
        const submissionArray = [
          {
            fields: {
              Timestamp: Date.now(),
              Dedication: dedication,
              OptionalNote: optional_note,
              OptionalLink: optional_link,
              OptionalPhoto: [{ url: optional_photo }],
              RoseSVG: [{ url: response.body["url"] }],
              Public: "Yes",
            },
          },
        ];
        base("RoseGarden").create(submissionArray, submissionCallBack);
      });

    event.preventDefault();
  }

  render() {
    const uploadTag = {
      cloudName: process.env.REACT_APP_CLOUD_NAME,
      uploadPreset: process.env.REACT_APP_PRESET_NAME,
    };
    let myWidget = window.cloudinary.createUploadWidget(uploadTag, (error, result) => {this.checkUploadResult(result)});
    const { dedication, optional_note, optional_link } = this.state;

    return (
      <React.Fragment>
        <div id="flower"></div>
        <div id="canvas-holder">
          <P5Wrapper sketch={sketch} />
        </div>
        <div id="submission">
          <label>
            <span className='medium-text'>Dedicated in Memory of:</span><br/>
            <input
              className="medium-text"
              type="text"
              value={dedication}
              onChange={this.handleDedication}
            />
          </label>
          <label>
            <span className='medium-text'>Leave a Note:</span>
            <textarea className="medium-text" value={optional_note} onChange={this.handleNote} />
          </label>
          <label>
            <span className='medium-text'>Leave a link:</span><br/>
            <input
              className="medium-text"
              type="text"
              value={optional_link}
              onChange={this.handleLink}
            />
          </label>
          <label>
            <div>
              <img id='photo-image-preview' src=''/>
              <button
                id="photo-button"
                onClick={() => this.showWidget(myWidget)}
              >
                <span id='inner-photo'>upload a photo (optional)</span>
              </button>
            </div>
          </label>
          <button id="review-button" onClick={this.showSubmit}>
            Review Dedication
          </button>
          <button id="submit-button" onClick={this.handleSubmit}>
            Submit Dedication
          </button>
        </div>
        <nav>
         <a href="/">↩ back to the garden</a>
         </nav>
        {this.state.formHere ? '' :


        <div className="info">

          <div className="info-text">
            <p className="medium-text">
              <span>
                content for ritual and time to pause before submitting
              </span>

            <button className="medium-text" id="modal-button" onClick={this.clickHandler}> Submit a Dedication</button>
            </p>
        </div>




        {/* <div id='about-garden' className="medium-text">
           <a href="/">About this Garden</a>
          </div> */}
      </div>

      }
      </React.Fragment>
    );
  }
}

export default Share;
