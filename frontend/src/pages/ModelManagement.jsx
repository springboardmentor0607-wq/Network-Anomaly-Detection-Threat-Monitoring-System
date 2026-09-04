import React, { useEffect, useState } from 'react';
import { socAPI } from '../services/api';
import {
  Brain,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Activity,
  Trash2,
  RefreshCw
} from 'lucide-react';

const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [newModel, setNewModel] = useState({
    name: '',
    algorithm: 'Random Forest'
  });

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await socAPI.getModels();
      setModels(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load persisted models.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadModels(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newModel.name.trim()) { setError('Model name is required.'); return; }
    try {
      const response = await socAPI.createModel(newModel);
      setModels([response.data, ...models]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create model.');
      return;
    }

    setNewModel({
      name: '',
      algorithm: 'Random Forest'
    });

    setShowForm(false);
  };

  const handleDelete = async (id) => {
    try { await socAPI.deleteModel(id); setModels(models.filter((model) => model.id !== id)); }
    catch (err) { setError(err.response?.data?.detail || 'Unable to delete model.'); }
  };
  const handleRun = async (model) => {
  try {
    const response = await socAPI.updateModelStatus(model.id, model.status === 'Active' ? 'stop' : 'activate');
    setModels(models.map((item) => item.id === response.data.id ? response.data : item));
  } catch (error) {
    setError(error.response?.data?.detail || `Failed to update ${model.name}`);
  }
};

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Brain className="w-7 h-7 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Model Management
              </h1>

              <p className="text-sm text-slate-400">
                Manage, monitor and deploy AI threat detection models
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-bold px-5 py-3 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            Add Model
          </button>

        </div>

        {/* Create Model */}
        {showForm && (
          <div className="bg-[#0d1527] border border-cyan-500/30 rounded-2xl p-6 mb-6">

            <h2 className="text-xl font-bold mb-5">
              Create New Model
            </h2>

            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >

              <div className="md:col-span-2">

                <label className="text-xs text-slate-400">
                  Model Name
                </label>

                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) =>
                    setNewModel({
                      ...newModel,
                      name: e.target.value
                    })
                  }
                  placeholder="Enter model name"
                  className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />

              </div>

              <div>

                <label className="text-xs text-slate-400">
                  Algorithm
                </label>

                <select
                  value={newModel.algorithm}
                  onChange={(e) =>
                    setNewModel({
                      ...newModel,
                      algorithm: e.target.value
                    })
                  }
                  className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white outline-none"
                >
                  <option>Random Forest</option>
                  <option>Isolation Forest</option>
                  <option>Logistic Regression</option>
                  <option>Gradient Boosting</option>
                </select>

              </div>

              <div className="md:col-span-3 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 rounded-xl border border-[#1b2a4a] text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-cyan-400 text-[#070b14] font-bold"
                >
                  Create Model
                </button>

              </div>

            </form>

          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Brain className="text-cyan-400 mb-4" />
            <p className="text-xs text-slate-400">
              TOTAL MODELS
            </p>
            <p className="text-3xl font-bold mt-2">
              {models.length}
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <CheckCircle className="text-green-400 mb-4" />
            <p className="text-xs text-slate-400">
              ACTIVE MODELS
            </p>
            <p className="text-3xl font-bold mt-2">
              {models.filter((m) => m.status === 'Active').length}
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Activity className="text-cyan-400 mb-4" />
            <p className="text-xs text-slate-400">
              BEST ACCURACY
            </p>
            <p className="text-3xl font-bold mt-2">
              {models.filter((model) => model.accuracy != null).sort((a, b) => b.accuracy - a.accuracy)[0]?.accuracy != null
                ? `${(models.filter((model) => model.accuracy != null).sort((a, b) => b.accuracy - a.accuracy)[0].accuracy * 100).toFixed(2)}%`
                : 'Not evaluated'}
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Clock className="text-yellow-400 mb-4" />
            <p className="text-xs text-slate-400">
              LAST UPDATED
            </p>
            <p className="text-lg font-bold mt-2">
              Just now
            </p>
          </div>

        </div>

        {/* Models */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                Available Models
              </h2>

              <p className="text-sm text-slate-400">
                AI models available for threat detection
              </p>
            </div>

            <button
              type="button"
              onClick={loadModels}
              className="p-2 rounded-lg border border-[#1b2a4a] hover:border-cyan-400 transition"
            >
              <RefreshCw className="w-5 h-5 text-cyan-400" />
            </button>

          </div>

          {error && <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">{error}</div>}

          <div className="space-y-4">
            {loading && <p className="text-sm text-slate-400">Loading models...</p>}
            {!loading && !error && models.length === 0 && <p className="text-sm text-slate-400">No models have been added.</p>}
            {!loading && models.map((model) => (

              <div
                key={model.id}
                className="bg-[#070b14] border border-[#1b2a4a] rounded-xl p-5"
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="flex items-start gap-4">

                    <div className="p-3 rounded-xl bg-cyan-500/10">
                      <Brain className="text-cyan-400" />
                    </div>

                    <div>

                      <div className="flex items-center gap-3">

                        <h3 className="font-bold text-lg">
                          {model.name}
                        </h3>

                        <span className="text-xs text-slate-500">
                          {model.version}
                        </span>

                      </div>

                      <p className="text-sm text-slate-400 mt-1">
                        {model.algorithm}
                      </p>

                      <p className="text-xs text-slate-500 mt-2">
                        Created: {model.created_at}
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

                    <div>
                      <p className="text-xs text-slate-500">
                        ACCURACY
                      </p>

                      <p className="font-bold mt-1">
                        {model.accuracy == null ? 'Not evaluated' : `${(model.accuracy * 100).toFixed(2)}%`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        STATUS
                      </p>

                      <div className="flex items-center gap-2 mt-1">

                        <span
                          className={`w-2 h-2 rounded-full ${
                            (model.status || (model.is_active ? 'Active' : 'Ready')) === 'Active'
                              ? 'bg-green-400'
                              : 'bg-cyan-400'
                          }`}
                        />

                        <span
                          className={
                            (model.status || (model.is_active ? 'Active' : 'Ready')) === 'Active'
                              ? 'text-green-400'
                              : 'text-cyan-400'
                          }
                        >
                          {model.status || (model.is_active ? 'Active' : 'Ready')}
                        </span>

                      </div>
                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                         onClick={() => handleRun(model)}
                        className="p-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20"
                        title="Run model"
                      >
                        <Play className="w-4 h-4 text-cyan-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(model.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
};

export default ModelManagement;