import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "http://127.0.0.1:8000";

const ALLOWED_ROLES = [
    "Administrator",
    "Security Analyst"
];

function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/auth/users`
            );

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.users || [];

            setUsers(data);

        } catch (err) {
            console.error("Failed to load users:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load users from the backend."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const deleteUser = async (id) => {
        if (!id) {
            alert("Invalid user ID.");
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeletingId(id);
            setError("");

            await axios.delete(
                `${API_URL}/auth/users/${id}`
            );

            await loadUsers();

        } catch (err) {
            console.error("Failed to delete user:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to delete the user."
            );

        } finally {
            setDeletingId(null);
        }
    };

    const getUserId = (user) => {
        return user.id || user._id;
    };

    const getName = (user) => {
        return user.name || user.username || "Unknown";
    };

    const getEmail = (user) => {
        return user.email || "Not available";
    };

    const getRole = (user) => {
        const role = user.role;

        if (ALLOWED_ROLES.includes(role)) {
            return role;
        }

        return "Security Analyst";
    };

    const getDepartment = (user) => {
        return user.department || "Not specified";
    };

    const getStatus = (user) => {
        return user.status || "Active";
    };

    const getStatusClass = (status) => {
        const value = String(status).toLowerCase();

        if (
            value === "active" ||
            value === "enabled" ||
            value === "online"
        ) {
            return "status-green";
        }

        if (
            value === "inactive" ||
            value === "disabled"
        ) {
            return "status-red";
        }

        return "status-yellow";
    };

    return (
        <div className="page">

            {/* ===========================
                HEADER
            ============================ */}

            <div className="topbar">

                <div>
                    <h1>👥 User Management</h1>

                    <p>
                        Manage registered users stored in MongoDB.
                    </p>
                </div>

                <button
                    type="button"
                    className="action-btn"
                    onClick={loadUsers}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "🔄 Refresh"}
                </button>

            </div>

            {/* ===========================
                ERROR
            ============================ */}

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* ===========================
                USER SUMMARY
            ============================ */}

            <div className="cards">

                <div className="card">
                    <h2>{users.length}</h2>
                    <p>Total Registered Users</p>
                </div>

                <div className="card">
                    <h2>
                        {
                            users.filter(
                                (user) =>
                                    String(
                                        getStatus(user)
                                    ).toLowerCase() === "active"
                            ).length
                        }
                    </h2>
                    <p>Active Users</p>
                </div>

                <div className="card">
                    <h2>
                        {
                            new Set(
                                users.map(
                                    (user) => getRole(user)
                                )
                            ).size
                        }
                    </h2>
                    <p>Roles in Use</p>
                </div>

            </div>

            {/* ===========================
                USERS TABLE
            ============================ */}

            <div className="section">

                <div className="topbar">

                    <div>
                        <h2>Registered Users</h2>

                        <p>
                            Live user information retrieved from MongoDB.
                        </p>
                    </div>

                </div>

                {loading ? (

                    <div className="warning-message">
                        ⏳ Loading users from MongoDB...
                    </div>

                ) : users.length === 0 ? (

                    <div className="warning-message">
                        ℹ️ No registered users were found in MongoDB.
                    </div>

                ) : (

                    <table>

                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {users.map((user, index) => {

                                const userId = getUserId(user);
                                const status = getStatus(user);

                                return (
                                    <tr
                                        key={
                                            userId ||
                                            user.email ||
                                            index
                                        }
                                    >

                                        <td>
                                            {getName(user)}
                                        </td>

                                        <td>
                                            {getEmail(user)}
                                        </td>

                                        <td>
                                            {getRole(user)}
                                        </td>

                                        <td>
                                            {getDepartment(user)}
                                        </td>

                                        <td
                                            className={getStatusClass(
                                                status
                                            )}
                                        >
                                            {status}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                disabled={
                                                    deletingId ===
                                                    userId
                                                }
                                                onClick={() =>
                                                    deleteUser(
                                                        userId
                                                    )
                                                }
                                            >
                                                {deletingId ===
                                                userId
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>

                                        </td>

                                    </tr>
                                );
                            })}

                        </tbody>

                    </table>

                )}

            </div>

        </div>
    );
}

export default UserManagementPage;