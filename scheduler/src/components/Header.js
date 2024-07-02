import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
    return (
        <header>
            <nav>
                <ul>
                    <Link to="/" className="main-link">Main</Link>
                </ul>
            </nav>
        </header>
    )
}
export default Header;