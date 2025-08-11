import React from 'react'

const Sidenav = () => {
  return (
    <nav className="sidenav-container">
      <ul className="font-medium">
          <li className="toggle"><span>Hi, Benedict!</span><div className="toggle-icon"><i className="fi fi-rr-angle-small-right"></i></div></li>
          <li>
              {/* <!-- <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"> --> */}
              <a>
                <i className="fi"></i>
                <span className="text">{}</span>
              </a>
          </li>
      </ul>
      <a className="profile-btn"><i className="fa-solid fa-user"></i></a>
    </nav>
  )
}

export default Sidenav